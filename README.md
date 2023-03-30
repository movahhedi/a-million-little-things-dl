# A Million Little Things S5 Downloader
A simple notifier when a new episode of ***A Million Little Things*** season 5 comes out in [YoozDL](https://yoozdl.top/2018%D8%AF%D8%A7%D9%86%D9%84%D9%88%D8%AF-%D8%B3%D8%B1%DB%8C%D8%A7%D9%84-a-million-little-things/).
Sends a message through a bot in Mattermost.

Create a `data` directory at the root of the repo, set the appropriate `chmod` permissions, then set the following as an hourly CRON job:
```
node index.js
```
