$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path $scriptPath
Set-Location $scriptDir



#docsify init ./docs
if (Get-Command "docsify" -ErrorAction SilentlyContinue)
{
    Invoke-Expression 'docsify serve docs'
}
else
{
    Write-Host "docsify not installed."
}
