# ADR 0029: Install `rnest` beside `ratsnest`, as a shorter name for the same executable

**Status:** Accepted · 2026-11-22

## Context

ratsnest is one executable that `install.sh` puts on the `PATH` as `ratsnest` (ADR 0016), and it is
typed for every command: `ratsnest check`, `ratsnest generate`, `ratsnest update`. The owner wants a
shorter name to type, `rnest`, without giving up the long one.

`ratsnest update` puts the new executable in place of the one running, which it finds as
`process.execPath` (ADR 0016). Run through a symbolic link, Bun gives the real file there, not the
link: so an update run as `rnest` replaces `ratsnest`, and `rnest` still points at it.

No release has been made yet (ADR 0021), so nobody has an installed ratsnest to move.

## Decision

**`install.sh` puts `rnest` beside `ratsnest`: a symbolic link to it, in the same folder.** Both
names run the same executable, so either can be typed, and an update through either replaces the one
file. The install leaves a file called `rnest` alone if it is not already a link to `ratsnest`, and
says so: that name belongs to something else.

**The docs write `rnest` in their examples**, and say once, where they start, that `rnest` and
`ratsnest` are the same. The program, its messages, its releases and its files keep the name
ratsnest.

## Considered options

- **A link to `ratsnest`, made by the install**: chosen. It adds a name without changing one, and an
  update keeps both.
- **Renaming the executable to `rnest`**: rejected. It would rename the release files, every message
  and every record's commands, while the tool, `ratsnest.json`, `.ratsnest/` and `RATSNEST_*` keep
  the long name, so the project would have two names where it now has one. It is cheapest now,
  before the first release, but the link gives the short name without it.
- **A copy, or a hard link, named `rnest`**: rejected. An update replaces only the file it runs from,
  so a copy would be left at the old version, and a hard link would be broken off by the rename that
  puts the new file in place.
- **A shell alias, left to each person**: not chosen. It works, but only in the shell whose profile
  has it, and every reader of the docs would have to make one before the examples ran.
- **A `rnest.cmd` beside the Windows executable**: not now. On Windows the executable is downloaded by
  hand, not installed by the script, so there is nothing to put it beside.

## Consequences

- **`rnest` is on the `PATH` wherever `install.sh` ran**, on Linux and macOS. On Windows it is there
  only if the downloaded file is saved as `rnest.exe`, which an update then keeps as it is.
- **The docs and the program speak of the command by two names.** The examples say `rnest`, while
  the program's own messages, the records before this one and the `circuit` skill's fallback say
  `ratsnest`. The docs' first mention says they are the same, and a reader who skips it may think
  otherwise.
- **An update through the link relies on Bun giving the real file as `process.execPath`.** The
  compiled check runs an update through a link on every system it runs on but Windows, and fails if
  the link has become a file.
- **An install that finds another `rnest` in its folder installs `ratsnest` alone**, and the short
  name is not there until that file is moved.
- **Uninstalling means removing two names**, the executable and its link.
