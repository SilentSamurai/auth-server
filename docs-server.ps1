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

# ssh -i "first-key-pair.pem" ec2-user@ec2-13-211-255-182.ap-southeast-2.compute.amazonaws.com
# source ~/.bashrc
#  scp -i ".\keys\first-key-pair.pem" deploy.zip  ec2-user@ec2-3-26-27-156.ap-southeast-2.compute.amazonaws.com:/home/ec2-user