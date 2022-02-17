# Common contributing steps

Most of the steps for working in this repo are the same as those for working
in https://github.com/microsoft/cadl. Refer to
https://github.com/microsoft/cadl/blob/main/CONTRIBUTING.md for most common
day-to-day operations. The rest of this document only covers the things that
are unique to this repo.

# Working with the core submodule

This repository uses a git
[submodule](https://git-scm.com/book/en/v2/Git-Tools-Submodules) for the
[Cadl OSS core](https://github.com/microsoft/cadl).

This section covers some basic everyday tasks for working with it. The steps
below are are really just one possible workflow. There's more than one way
to accomplish these tasks and if you prefer to do it differently, that's
fine too!

## Configuring git to recurse submodules automatically for most commands

Run the following command:

```
git config --global submodule.recurse true
```

This will effectively pass `--recurse-submodules` for you to git commands
that accept it. It should eliminate some of the common pain points around
submodules.

NOTE: git clone is exceptional, see below.

## Cloning recursively

`git clone` does not recurse submodules automatically, even with
submodule.recurse=true as configured above.

Fork the repo, then clone recursively as follows:

```
git clone --recurse-submodules https://github.com/(your_username)/cadl-azure
```

## Updating and initializing the submodule

In some situations, even with the above setting, you may still end up with the core/ folder
being uninitialized and not having a good clone of microsoft/cadl, or with the core/ folder
initialized, but checked out to the wrong commit for the current branch. To fix this, run the
following command to update and initialize the submodule:

```
git submodule update --init
```

## Point the submodule origin remote to your fork

You can change the remotes of the submodule so that `origin` is your fork of
microsoft/cadl rather than microsoft/cadl itself, and microsoft/cadl is
`upstream`:

```
cd core
git remote remove origin
git remote add origin https://github.com/(your_username)/cadl
git remote add upstream https://github.com/microsoft/cadl
```

## Forcing dependabot to send a submodule update PR

Normally, the submodule is updated automatically once per day (except on
weekends) by automated PRs from dependabot. If you would like dependabot to
perform an update right away, you can:

- Go here: https://github.com/Azure/cadl-azure/network/updates
- Click on "Last updated X hours ago" link
- Click on "Check for updates button"

## Making a cross-cutting change across both repos

1. Make matching branches:

```
cd core
git checkout -b myfeature

cd ..
git checkout -b myfeature
```

2. Make your changes as needed to both repos.

3. Commit changes to both repos:

```
cd core
git commit -a -m "Core part of my change"

cd ..
git commit -a -m "Azure-specific part of my change"
```

4. Push

```
git push origin myfeature
```

NOTE: If you configured submodule.recurse=true as shown above, this will
automatically push the submodule cadl branch along with the cadl-azure
branch. If you prefer not to use that, then `cd core` and push that too.

5. Create 2 PRs from the two branches that were pushed to your
   microsoft/cadl and Azure/cadl-azure forks. Start with the microsoft/cadl
   PR, then follow up with the Azure/cadl-azure PR that depends on it.

6. Get approval for both PRs before merging either of them.

7. Merge the microsoft/cadl PR first.

8. Update the submodule to point to the actual commit you merged to microsoft/cadl main:

```
cd core
git fetch --all
git checkout upstream/main

cd ..
git commit -a -m "Update submodule"
git push origin myfeature
```

9. Merge the cadl-azure PR and you're done.

Note that you only need to do all of the above when your changes span both
repos. If you are only changing one repo or the other, then just work in
each individual repo as you would any other.

## Publishing

Do the following to publish a new release:

1. Announce to coworkers on Teams in Cadl Engineering channel that you will
   be publishing and that they should hold off on merging until the process
   is complete.

2. Make sure your working copy is clean and you are up-to-date and on the
   main branch.

3. Run `rush prepare-publish` to stage the publishing changes.

If it works you'll get a message like this:

```
Success! Push publish/kvd01q9v branches and send PRs.
```

4. Follow steps 4-9 in [making a cross-cutting change across both
   repos](#making-a-cross-cutting-change-across-both-repos) to send PRs from
   the generated `publish/<unique_id>` branches and merge them.

**NOTE**: The reason for step 1 to ask for folks to avoid merging while
publishing is in progress is that any changes merged to the repo while the
publish PR would become part of the release, but the release changelogs
would not include their descriptions. For this reason, publish PRs will fail
if this happens and you will have to close them and start over. In the case
where you are in another time zone and unable to coordinate with the rest of
the team, it may be easier to ask on Teams for someone in a closer time zone
to coordinate and perform the publish in the morning.
