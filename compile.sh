#!/bin/bash
set -e # Exit with a failure code if anything goes wrong

if [[ $CHANGE_ID ]]; then
    echo 'In a pull request'
elif [[ $GIT_BRANCH = 'master' ]]; then
    echo 'On master'
fi
