# Registra a tarefa agendada que sobe a sessao Remote Control no logon do usuario,
# a partir do remote-control-task.xml desta pasta. Roda no PowerShell do proprio
# usuario, sem admin. Antes: copie start-remote-control.ps1 para %USERPROFILE%\.claude\.
#
# Uso:    .\install-remote-control-task.ps1 -Workspace C:\caminho\do\projeto [-Name nome-da-sessao] [-DryRun]
#         -DryRun so imprime o XML preenchido, sem registrar nada.
# Status: Get-ScheduledTaskInfo -TaskName '<nome> Remote Control'
# Tirar:  Unregister-ScheduledTask -TaskName '<nome> Remote Control' -Confirm:$false

param(
    [Parameter(Mandatory = $true)][string]$Workspace,
    [string]$Name = (Split-Path -Leaf $Workspace),
    [switch]$DryRun
)

$script = "$env:USERPROFILE\.claude\start-remote-control.ps1"
if (-not (Test-Path $script)) { throw "Copie start-remote-control.ps1 para $script antes de registrar a tarefa." }

$valores = @{
    '{{USER}}'      = "$env:USERDOMAIN\$env:USERNAME"
    '{{NAME}}'      = $Name
    '{{SCRIPT}}'    = $script
    '{{WORKSPACE}}' = (Resolve-Path $Workspace).Path
    '{{CONHOST}}'   = "$env:SystemRoot\System32\conhost.exe"
}
$xml = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot 'remote-control-task.xml'))
foreach ($k in $valores.Keys) { $xml = $xml.Replace($k, [System.Security.SecurityElement]::Escape($valores[$k])) }

if ($DryRun) { return $xml }
Register-ScheduledTask -TaskName "$Name Remote Control" -Xml $xml
