


import './k8s-build.just'
import './ui/ui.just'
import './srv/srv.just'

set windows-shell := ["powershell.exe", "-c"]

default: help

dev-server:
    Start-Job -ScriptBlock { just web-dev-start }
    just api-dev-start
    Get-Job | Remove-Job


help:
  just --list