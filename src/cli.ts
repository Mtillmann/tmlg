import {Util} from "@/classes/Util";
import {defaultSettings} from "@/cli_settings";
import {FsStorage} from "@/classes/FsStorage";
import {Settings} from "@/classes/CLI/Settings";
import {Sync} from "@/classes/CLI/Sync";
import {Timelog} from "@/classes/CLI/Timelog";
import {List} from "@/classes/CLI/List";
import type {ISettings} from "@/types/ISettings";

const process = require('process');

const util = new Util();
const {defaultDateFormat, defaultDateRangeFormat} = (new Util()).defaultDates();
const storage: FsStorage = new FsStorage();
const settings: ISettings = storage.get('settings', {
    ...defaultSettings, ...{
        dateFormat: defaultDateFormat,
        dateRangeFormat: defaultDateRangeFormat
    }
});

if (!settings.deviceId) {
    settings.deviceName = `node ${process.version} ${process.platform} (${process.arch})`;
    settings.deviceId = util.hash(16);
    storage.set('settings', settings);
}

const argv: { [index: string]: any } = require('minimist')(process.argv.slice(2)),
    argk: string[] = Object.keys(argv);


if (argk.length === 1 && argk[0] === '_' && argv._.length > 0) {
    (new Timelog(settings)).create(argv._.join(' '))

    if (settings.cli_syncOnSave) {
        (new Sync(settings)).synchronize(true)
    }

} else if ('sync-info' in argv) {
    (new Sync(settings)).showCredentials();
} else if ('settings' in argv) {
    (new Settings(settings)).list()
} else if ('set' in argv) {
    (new Settings(settings)).set(argv.set || argv.s, '_' in argv && argv._.length > 0 ? argv._.join(' ') : null)
} else if ('sync-setup' in argv) {
    (new Sync(settings)).setup(argv);
} else if ('time' in argv) {
    (new Timelog(settings)).time(argv.time);
} else if ('pause' in argv) {
    (new Timelog(settings)).pause(argv.pause);
} else if ('resume' in argv) {
    (new Timelog(settings)).unpause(argv.resume);
} else if ('kill' in argv) {
    (new Timelog(settings)).kill(argv.kill);
} else if ('stop' in argv) {
    (new Timelog(settings)).stop(argv.stop);
} else if ('h' in argv || 'help' in argv) {
    console.log([
        'usage: tmlg [options|timelog]',
        '',
        'use a quoted string as argument to create a timelog, e.g. "@acme #admin did some stuff and such"',
        '',
        'options:',
        '  -h --help      Show this help',
        '  -e --edit      Edit timelog of given hash',
        '  -d --delete    Delete timelog of given hash',
        '',
        '  -t             Take N timelogs [10]',
        '  -s             Skip N timelogs [0]',
        '  -c             List of columns to show [date,clients,projects,tasks,sources,duration,cost,description]',
        '  -w             week to show timelogs of, e.g. -w yyyy-mm-dd',
        '  -m             month to show timelogs of, e.g. -m yyyy-mm-dd',
        '  --export       Export current view to given filename, ' +
        '                 use xlsx, odt, txt or csv as extension, e.g. --export logs.odt',
        '',
        '  --serve        server dist/ via http-server, use `--port 1234` etc to pass options to http-server',
        '',
        '  --settings     Show current settings',
        '  --set          Set a setting, omit value for interactive, e.g. --set syncEnabled true',
        '',
        '  --sync         Sync now',
        '  --sync-info    Show current sync credentials',
        '  --sync-setup   Launch interactive sync setup',
        '  --sync-enable  Toggle sync ON',
        '  --sync-disable Toggle sync OFF',
        '  --show-sync    Show URL (with --url) and cli sync setup, use --include-password to include password',
        '',
        '  --time         Start a timer for given timelog, e.g. --time "@acme #waiting this may take some time..."',
        '  --pause        Pause a currently running timer by index, e.g. --pause 1',
        '  --resume       Resume a currently running timer by index, e.g. --resume 1',
        '  --kill         Destroy a currently running timer by index, e.g. --kill 1',
        '  --stop         Stop and convert a currently running timer to timelog by index, e.g. --stop 1',
    ].join('\n'));
} else if ('e' in argv) {
    (new Timelog(settings)).edit(argv.e).then(() => {
        if (settings.cli_syncOnSave) {
            (new Sync(settings)).synchronize(true)
        }
    });

} else if ('d' in argv) {
    (new Timelog(settings)).delete(argv.d).then(() => {
        if (settings.cli_syncOnSave) {
            (new Sync(settings)).synchronize(true)
        }
    });
} else if ('serve' in argv) {
    const cp = require('child_process');

    let childArgv = ['./dist', '-o '];
    for (const key in argv) {
        if (['_', 'serve'].indexOf(key) > -1) {
            continue;
        }
        childArgv.push((key.length === 1 ? '-' : '--') + key + ' ' + argv[key]);
    }

    cp.fork(__dirname+'/../node_modules/http-server/bin/http-server', childArgv, {});

} else if ('sync-enable' in argv || 'sync-disable' in argv) {
    (new Sync(settings)).toggle('sync-enable' in argv);
} else if ('sync' in argv) {
    (new Sync(settings)).synchronize();
} else if ('show-sync' in argv) {


    let url = 'url' in argv ? argv.url : false,
        includePassword = 'include-password' in argv,
        s = (new Sync(settings));

    if (!s.credentials) {
        console.log('no sync credentials set')
    } else {

        s.sync.createConnectionStrings(url, includePassword)
            .then((r: { [index: string]: string }) => {
                if (r.url) {
                    console.log(`Use this URL to sync another browser: `);
                    console.log(r.url);
                }
                console.log(`Use this command to sync another shell: `);
                console.log(r.cli);
            })
    }
} else {

    (new Timelog(settings)).listTimers();

    if ('w' in argv || 'm' in argv) {
        (new List(settings)).range(argv.w || argv.m, 'm' in argv ? 'month' : 'week', argv.c || null, argv.export || null);
    } else {
        (new List(settings)).list(argv.t || 10, argv.s || 0, argv.c || null, argv.export || null);
    }
}


