#!/bin/bash

# Read the given .env.diploi file
while IFS= read -r line
do
  # Skip comments & empty lines
  if [[ -n $line && ${line::1} != "#" ]]; then
    # Split line into target & source env variable names
    parts=(${line//=/ })
    # Assign the target env to the value of the source env
    export ${parts[0]}=$(printenv ${parts[1]})
  fi
done < "./.env.diploi"

# FIXME: Just an idea, not in use atm.