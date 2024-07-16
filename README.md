# Odysseus Long Range (LORA) Science Voyager

Frontend for LORA. Used on the ESS Odysseus bridge to explore the starmap, send probes to scan planets and nearby sectors to reveal details, decrypt signals that reveal jump coordinates, and initiate the jump sequence.

<img width="1510" alt="Screenshot 2024-07-09 at 21 00 00" src="https://github.com/user-attachments/assets/4196d839-4ea9-4295-b043-c7a0f9aa7a3a">


## Tech

- Node v18.14.0

## Local setup

**NOTE!** Does not work in Windows environment as such. With Windows use [Local setup in VSCode dev containers](#local-setup-in-vscode-dev-containers).

- **`NOTE!`** Make sure you are running `Odysseus Backend`!
- Run `npm install -force` to install dependencies
- If you are running the backend on non-default port (8888), update the proper API URL to `apiUrl` variable in `./src/environments/environment.ts` and to `apigen` script in `package.json`
- Run `npm start` to start the backend server

Jump UI should now be available at [http://localhost:4300](http://localhost:4300)

## LocaL setup in VSCode dev containers

You can also run the backend using [VSCode dev containers](https://code.visualstudio.com/docs/devcontainers/containers). Create/update your .env file like in the local setup instructions.

### Requirements

- [Docker](https://www.docker.com/)
- [VSCode](https://code.visualstudio.com/) with [Dev Containers](https://code.visualstudio.com/docs/devcontainers/tutorial#_install-the-extension) extension
- [Odysseus Backend](https://github.com/OdysseusLarp/odysseus-backend)

### Setup

- **`NOTE!`** Make sure you are running `Odysseus Backend`!
- Open new window in VSCode
- File --> Open Folder... --> `odysseus-jump-ui`
- VSCode will ask do you want to `Reopen in Container` --> Click it
  - If you are too slow --> Click the button in left bottom corner (looks like two L:s or disjointed ><) and choose `Reopen in Container` from the menu.
- VSCode will then start up container/service, install npm packages and start the service.

### Problems?

- Try to rebuild the container: Click the button in left bottom corner (looks like two L:s or disjointed >< with the container name) and choose `Rebuild Container` from the menu.
- You might run into [this issue](https://github.com/microsoft/vscode-remote-release/issues/7305) on ARM processors, see the issue for potential workarounds.
