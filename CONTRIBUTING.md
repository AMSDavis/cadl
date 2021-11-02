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

## Initializing the submodule

In some situations, you may end up with the core/ folder being uninitialized
and not having a good clone of microsoft/cadl. To initialize the submodule
when that happens, run the following command:

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

8. If you squashed the microsoft/cadl PR, then update the submodule to point
   to the actual commit you merged to microsoft/cadl main:

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

1. Make sure your working copy is clean and you are up-to-date and on the
   main branch.

2. Run `rush prepare-publish`

If it works you'll get a message like this:

```
Success! Push publish/kvd01q9v branches and send PRs.
```

(NOTE: The branch name is uniquely generated for every run of `rush
prepare-publish`.)

What's happened here is basically that steps 1-3 of cross-cutting change
guidance above have basically been automated for you. Now proceed through
steps 4-9 to send PRs. Once you merge them, CI will automatically publish
new versions of packages to npmjs.org.
