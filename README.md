# TMLG

A simple and fast time logger for web and cli:

- [simple syntax](https://mtillmann.github.io/tmlg/#h=help), no unnecessary controls
- responsive, color-scheme-aware frontend
- serverless synchronization between multiple devices
- zero requirements and dependencies (except a decent browser)
- bundled with http-server
- supports timers
- exports to xlsx, odt...

## Usage

Use this [instance hosted on github](https://mtillmann.github.io/tmlg) or install it on your own.

## Installation

Run `npm i tmlg -g`, then just run `tmlg --serve`. Pass any [http-server](https://github.com/http-party/http-server/)
options to the same command, e.g. `tmlg --serve --port 1234`...

You can also just download this repo and put the contents of `/dist/` on any http server.

> The app needs to served either from `localhost` or a `SSL`-enabled server, otherwise the browser might deny access to certain APIs

## CLI Usage

```text
usage: tmlg [options|timelog]

use a quoted string as argument to create a timelog, e.g. "@acme #admin did some stuff and such"

options:
  -h --help      Show this help
  -e --edit      Edit timelog of given hash
  -d --delete    Delete timelog of given hash

  -t             Take N timelogs [10]
  -s             Skip N timelogs [0]
  -c             List of columns to show [date,clients,projects,tasks,sources,duration,cost,description]
  -w             week to show timelogs of, e.g. -w yyyy-mm-dd
  -m             month to show timelogs of, e.g. -m yyyy-mm-dd
  --export       Export current view to given filename, '
                 use xlsx, odt, txt or csv as extension, e.g. --export logs.odt

  --serve        server dist/ via http-server, use `--port 1234` etc to pass options to http-server

  --settings     Show current settings
  --set          Set a setting, omit value for interactive, e.g. --set syncEnabled true

  --sync         Sync now
  --sync-info    Show current sync credentials
  --sync-setup   Launch interactive sync setup
  --sync-enable  Toggle sync ON
  --sync-disable Toggle sync OFF
  --show-sync    Show URL (with --url) and cli sync setup, use --include-password to include password

  --time         Start a timer for given timelog, e.g. --time "@acme #waiting this may take some time..."
  --pause        Pause a currently running timer by index, e.g. --pause 1
  --resume       Resume a currently running timer by index, e.g. --resume 1
  --kill         Destroy a currently running timer by index, e.g. --kill 1
  --stop         Stop and convert a currently running timer to timelog by index, e.g. --stop 1
```
