# localmart

localmart is a platform for local businesses to sell their products and services to local customers.


## Development

### Prerequisites

For development:
- Docker
- Docker Compose

### Usage

To start the next.js frontend, the Python backend, and the database, run:
```bash
make
```

To clear the database and the frontend next.js cache:
```bash
make clean-data
```

### Debugging Tips
1. If the app is not loading porperly on your machine, try:
   - clearing the data with `make clean-data`
   - restarting with `make`

## Secret Management

We use GPG encryption to securely store sensitive files. The encrypted files are stored in the `gpg-secrets/` directory and can only be decrypted by authorized team members.

### Prerequisites

1. Install GPG on your system:
   ```bash
   # macOS
   brew install gnupg

   # Ubuntu/Debian
   sudo apt-get install gnupg
   ```

2. Have your own GPG key pair and upload the public key to your GitHub profile
   ([GitHub guide on adding GPG keys](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account))

### Managing Secrets

The following commands are available:

1. Import team members' GPG keys:
   ```bash
   # Import team members' GPG keys
   make import-gpg-keys
   ```

2. Encrypt a file:
   ```bash
   # The file will be encrypted and stored in gpg-secrets/
   make encrypt-file FILE=path/to/your/file

   # Example: Encrypt staging environment variables
   make encrypt-file FILE=gpg-secrets/staging.env
   ```

3. Decrypt a file:
   ```bash
   # Only works with files in the gpg-secrets/ directory
   make decrypt-file FILE=gpg-secrets/your-file.gpg

   # Example: Decrypt staging environment variables
   make decrypt-file FILE=gpg-secrets/staging.env.gpg
   ```

### Notes

- Only files in the `gpg-secrets/` directory with the `.gpg` extension are tracked in Git
- Decrypted files are automatically placed in the `gpg-secrets/` directory
- You must have your private key to decrypt files
- The list of team members is maintained in the Makefile's `GITHUB_USERS` variable