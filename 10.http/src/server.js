const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const os = require('os');
const {createReadStream }= require('fs')

// -------------------
const chalk = require('chalk');
const mime = require('mime');
const ejs = require('ejs')

let networks = os.networkInterfaces();
let address = Object.values(networks).flat().find(item => item.family === 'IPv4').address

class Server {
    constructor(options) {
        this.port = options.port;
        this.directory = options.directory;
    }
    handleRequest = async (req, res) => {
        const { pathname } = url.parse(req.url); // 获取资源路径
        let filepath = path.join(this.directory, pathname);

        try{
            let statObj = await fs.stat(filepath);
            if(statObj.isFile()){
                this.sendFile(filepath,req,res)
            }else{
                let dirs = await fs.readdir(filepath);
                dirs = dirs.map(dir=>({dir,href:path.join(pathname,dir)}))
                let htmlStr =  await ejs.renderFile(path.resolve(__dirname,'template.html'),{dirs});
                res.end(htmlStr)
            }
        }catch(e){
            console.log(e)
        }
     
    }
    sendFile(filepath,req,res){
        res.setHeader('Content-Type',mime.getType(filepath)+';charset=utf-8');
        createReadStream(filepath).pipe(res)
    }
    start() {
        const server = http.createServer(this.handleRequest);
        server.listen(this.port, () => {
            console.log(`Available on:
    http://${address}:${chalk.green(this.port)}
    http://127.0.0.1:${chalk.green(this.port)}
${chalk.yellow('Hit CTRL-C to stop the server')}`)
        })
    }
}

module.exports = Server