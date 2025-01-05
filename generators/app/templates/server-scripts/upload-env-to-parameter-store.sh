#!/usr/bin/env bash
if [[ $# -lt 2 ]]; then
    echo "You either did not specify a file path, or a parameter path (formatted as /path/) to use in AWS SSM Parameter Store"
    exit 1
fi

if [[ "$*" == *"--overwrite"* ]]; then
    overwrite_flag=" --overwrite"
    # Removing the --overwrite from positional parameters for easier handling
    set -- "${@/--overwrite/}"
fi

# Use a buffer to store the last line
last_line=""

while IFS= read -r line || [[ -n $line ]]; do
    last_line="$line"
    # Skip lines starting with the comment symbol (#)
    if [[ $line =~ ^\s*# ]]; then
        continue
    fi

    # Split the line into key-value pair
    cleaned_line=$(echo "$line" | sed 's/#.*//')
    IFS='=' read -r param_name param_value <<< "$cleaned_line"

    # Check if both key and value exist
    if [[ -z $param_name || -z $param_value ]]; then
        echo "This line could not be processed: $line"
        continue
    fi

      # Determine parameter type based on #plaintext comment
    if [[ $line =~ "#plaintext" ]]; then
        param_type="String"
    else
        param_type="SecureString"
    fi

    # Clean parameter name and value
    param_name=$(echo "$param_name" | tr -d '[:blank:]"')
    param_value=$(echo "$param_value" | tr -d '[:blank:]"')

    # Perform AWS command
    aws ssm put-parameter$overwrite_flag --name ${2}${param_name} --value $param_value --type $param_type
done < "$1"