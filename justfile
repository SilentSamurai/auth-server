


import './k8s-build.just'
import './ui/ui.just'
import './srv/srv.just'

set windows-shell := ["powershell.exe", "-c"]

default: help

start:
    Start-Process powershell -ArgumentList "-NoExit", "-Command just start-srv"
    Start-Process powershell -ArgumentList "-NoExit", "-Command just start-ui"


help:
  just --list