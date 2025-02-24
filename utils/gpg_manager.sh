#!/bin/bash

# Function to display usage information
show_usage() {
    echo "Usage:"
    echo "  $0 import-keys                          # Import GPG keys from GITHUB_USERS env var"
    echo "  $0 encrypt FILE                         # Encrypt a file using imported GPG keys"
    echo "  $0 decrypt FILE                         # Decrypt a GPG encrypted file"
    exit 1
}

# Function to get key ID from GitHub username
get_key_id() {
    local username=$1
    local key_data
    key_data=$(curl -s "https://github.com/$username.gpg")
    if [ -n "$key_data" ]; then
        echo "$key_data" | gpg --batch --import 2>/dev/null
        # Get the key ID of the most recently imported key
        echo "$key_data" | gpg --batch --with-colons --show-keys 2>/dev/null | grep '^pub' | cut -d: -f5
    fi
}

# Function to import GPG keys from GitHub
import_keys() {
    if [ -z "$GITHUB_USERS" ]; then
        echo "Error: GITHUB_USERS environment variable not set"
        echo "Please set GITHUB_USERS as a comma-separated list of GitHub usernames"
        exit 1
    fi

    # Convert comma-separated list to array
    IFS=',' read -ra USERS <<< "$GITHUB_USERS"
    
    # Create a temporary file to store key IDs
    key_ids_file=$(mktemp)
    
    for username in "${USERS[@]}"; do
        # Remove any leading/trailing whitespace and @ symbol
        username=$(echo "$username" | tr -d '[:space:]' | sed 's/^@//')
        if [ -n "$username" ]; then
            echo "Importing GPG key for GitHub user: $username"
            key_id=$(get_key_id "$username")
            if [ -n "$key_id" ]; then
                echo "$key_id" >> "$key_ids_file"
            else
                echo "Warning: Could not import key for user $username"
            fi
        fi
    done

    # Store the key IDs in a more permanent location for later use
    mkdir -p ~/.localmart
    mv "$key_ids_file" ~/.localmart/github_key_ids
    echo "Imported keys have been stored in ~/.localmart/github_key_ids"
}

# Function to encrypt a file
encrypt_file() {
    local input_file=$1
    if [ ! -f "$input_file" ]; then
        echo "Error: Input file not found: $input_file"
        exit 1
    fi

    # Check if we have stored key IDs
    if [ ! -f ~/.localmart/github_key_ids ]; then
        echo "Error: No GitHub keys found. Please run import-keys first."
        exit 1
    fi

    # Build recipient arguments from stored key IDs
    recipient_args=""
    while IFS= read -r key_id; do
        if [ -n "$key_id" ]; then
            recipient_args="$recipient_args -r $key_id"
        fi
    done < ~/.localmart/github_key_ids

    if [ -z "$recipient_args" ]; then
        echo "Error: No valid recipient keys found"
        exit 1
    fi

    # Create output filename
    mkdir -p gpg-secrets
    output_file="gpg-secrets/$(basename "$input_file").gpg"
    
    # Encrypt the file for all recipients
    gpg --batch --yes --trust-model always $recipient_args --encrypt --output "$output_file" "$input_file" 2>/dev/null
    echo "File encrypted: $output_file"
}

# Function to decrypt a file
decrypt_file() {
    local input_file=$1
    if [ ! -f "$input_file" ]; then
        echo "Error: Input file not found: $input_file"
        exit 1
    fi

    if [[ ! "$input_file" =~ \.gpg$ ]]; then
        echo "Error: Input file must have .gpg extension"
        exit 1
    fi

    if [[ ! "$input_file" =~ ^gpg-secrets/ ]]; then
        echo "Error: Can only decrypt files from the gpg-secrets directory"
        exit 1
    fi

    # Create output filename (remove .gpg extension)
    output_file="${input_file%.gpg}"
    
    # Decrypt the file
    gpg --batch --yes --decrypt --output "$output_file" "$input_file" 2>/dev/null
    echo "File decrypted: $output_file"
}

# Main script logic
case "$1" in
    "import-keys")
        import_keys
        ;;
    "encrypt")
        if [ -z "$2" ]; then
            show_usage
        fi
        encrypt_file "$2"
        ;;
    "decrypt")
        if [ -z "$2" ]; then
            show_usage
        fi
        decrypt_file "$2"
        ;;
    *)
        show_usage
        ;;
esac 