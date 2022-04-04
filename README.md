# 🚢 batnav-server

[![GitHub Forks](https://img.shields.io/github/forks/GerardoWacker/batnav-server.svg?style=social&label=Fork&maxAge=2592000)](https://github.com/GerardoWacker/batnav-server/network)
[![GitHub Stars](https://img.shields.io/github/stars/GerardoWacker/batnav-server.svg?style=social&label=Star&maxAge=2592000)](https://github.com/GerardoWacker/batnav-server/stargazers)
[![GitHub Watches](https://img.shields.io/github/watchers/GerardoWacker/batnav-server.svg?style=social&label=Watch&maxAge=2592000)](https://github.com/GerardoWacker/batnav-server/watchers)
[![HitCount](http://hits.dwyl.com/GerardoWacker/damas-server.svg)](http://hits.dwyl.com/GerardoWacker/batnav-server)

## ❓ FAQ

### 🤔 What's this?

**batnav** is a **[multiplayer Naval Battle simulator](https://github.com/gerardowacker/batnav)**. Client-server are
extremely needed in a **multiplayer** environment, so this solves the missing variable in the equation.

**batnav-server** is a modular server, that includes an express-coded Rest API, as well as a socket.io-based real-time
connection handler. Everything JS, as the world originally intended.

### 🤔 What can it do?

- It handles database connections to fetch required data, but just the right amount. It includes a configurable-database
  manager that can be easily pointed to every modern MongoDB instance.
- It can handle sessions, so you don't have to worry about multiple people logging into the same user simultaneously.
- It handles everything required to create matches between players. In the future, the ability to create custom games
  may be added.
- Apart from the above, it can also set up a matchmaking environment, including rankings and queues.
- Finally, if it wasn't obvious yet, it's responsible for creating real-time connections, with an active packet exchange
  between clients.

## How to use?

The **usual**.

### 💻 Run

```shell
npm start
```

### ⬇ Update

To update the repository's source code in your local environment, run the following command, inside the `batnav-server`
directory:

```shell
git pull
```

### ✏ Develop

This is a personal project, so there's no need to commit into it. Nevertheless, if you want to help, make sure you have
the following before beginning:

- NodeJS 14 or later.
- A compatible IDE. We recommend [neovim](https://neovim.io/), [JetBrains WebStorm](https://www.jetbrains.com/webstorm/)
  or [Visual Studio Code](https://code.visualstudio.com/).

To state changes in the codebase, you must follow certain steps:

- First, [create your own fork](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/fork-a-repo)
, based on the current codebase.
- Then, [open a pull request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)
to notify us that your code is ready for review.

This way, you may be able to turn into an active contributor of the `batnav-server` project.

## 📝 License

**[GerardoWacker/batnav-server](https://github.com/GerardoWacker/batnav-server)** is protected by
the [GNU Public Licence 3](https://opensource.org/licenses/GPL-3.0).
