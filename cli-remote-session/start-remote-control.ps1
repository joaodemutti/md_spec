# Sobe UMA sessao Claude Code Remote Control num workspace, reaproveitando
# sempre a MESMA sessao (via --session-id) pra nao acumular sessao na conta.
# Se a sessao gravada nao existir mais, cria uma nova e grava o id dela.
#
# Uso: powershell -File start-remote-control.ps1 -Workspace C:\caminho\do\projeto [-Name nome-da-sessao]
# No logon, quem chama e a tarefa agendada (ver install-remote-control-task.ps1).

param(
    [Parameter(Mandatory = $true)][string]$Workspace,
    [string]$Name = (Split-Path -Leaf $Workspace)
)

$claudeDir = "$env:USERPROFILE\.claude"
$log       = "$claudeDir\remote-control-$Name-startup.log"
$idFile    = "$claudeDir\remote-control-$Name-session-id.txt"
$outFile   = "$claudeDir\remote-control-$Name-out.log"
$errFile   = "$claudeDir\remote-control-$Name-err.log"

function Log($m) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" | Add-Content -Path $log -Encoding utf8 }

function Get-SessionIdFromOutput {
    if (-not (Test-Path $outFile)) { return $null }
    $raw = Get-Content $outFile -Raw -ErrorAction SilentlyContinue
    if ($raw -match '(session_[A-Za-z0-9]+)') { return $Matches[1] }
    return $null
}

function Start-RC($rcArgs) {
    Remove-Item $outFile, $errFile -ErrorAction SilentlyContinue
    return Start-Process -FilePath $exe -ArgumentList $rcArgs -WorkingDirectory $Workspace `
        -RedirectStandardOutput $outFile -RedirectStandardError $errFile `
        -PassThru -WindowStyle Hidden
}

Log '--- launcher iniciado ---'

$mutex = New-Object System.Threading.Mutex($false, "Local\claude-remote-control-$Name")
$acquired = $false
try { $acquired = $mutex.WaitOne(0) }
catch [System.Threading.AbandonedMutexException] { $acquired = $true }
if (-not $acquired) { Log 'ja existe sessao rodando, saindo'; exit 0 }

try {
    # claude.exe: o do WinGet, o do instalador nativo, ou o que estiver no PATH
    $exe = @(
        (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Anthropic.ClaudeCode_*\claude.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).FullName,
        "$env:USERPROFILE\.local\bin\claude.exe",
        (Get-Command claude -ErrorAction SilentlyContinue).Source
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
    if (-not $exe) { Log 'ERRO: claude.exe nao encontrado'; exit 1 }

    $proc = $null

    # 1) tenta reatar na sessao gravada
    if (Test-Path $idFile) {
        $id = "$(Get-Content $idFile -Raw -ErrorAction SilentlyContinue)".Trim()
        if ($id) {
            Log "tentando reatar na sessao $id"
            $proc = Start-RC @('remote-control', '--session-id', $id, '--permission-mode', 'auto')
            Start-Sleep -Seconds 20
            if ($proc.HasExited) {
                Log "reatar FALHOU (exit $($proc.ExitCode)) - vou criar sessao nova"
                $proc = $null
                Remove-Item $idFile -ErrorAction SilentlyContinue
            } else {
                Log "reatado com sucesso em $id"
            }
        }
    }

    # 2) fallback: cria sessao nova e grava o id
    if (-not $proc) {
        Log 'criando sessao nova'
        $proc = Start-RC @('remote-control', '--name', $Name, '--permission-mode', 'auto')
        Start-Sleep -Seconds 20
        if ($proc.HasExited) {
            Log "ERRO: sessao nova morreu na largada (exit $($proc.ExitCode))"
            exit 1
        }
        $newId = Get-SessionIdFromOutput
        if ($newId) { $newId | Set-Content $idFile -Encoding ascii; Log "sessao nova gravada: $newId" }
        else { Log 'AVISO: nao consegui extrair o session id da saida' }
    }

    Log "sessao ativa (PID $($proc.Id)) - segurando o mutex ate ela morrer"
    Wait-Process -Id $proc.Id
    Log "sessao encerrou (exit $($proc.ExitCode))"
}
catch { Log "ERRO: $_" }
finally {
    try { $mutex.ReleaseMutex() } catch { }
    $mutex.Dispose()
}
