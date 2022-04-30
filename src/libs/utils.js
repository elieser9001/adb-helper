const { builtinModules } = require('module')

const fs = require('fs').promises

const INFO_HTML_PATH = __dirname + '/../ui/info.html'
const CONTACTS_HTML_PATH = __dirname + '/../ui/contacts.html'
const SCREENSHOT_HTML_PATH = __dirname + '/../ui/screenshot.html'
const FILES_HTML_PATH = __dirname + '/../ui/files.html'
const WHATSAPP_HTML_PATH = __dirname + '/../ui/whatsapp.html'
const PROCESS_HTML_PATH = __dirname + '/../ui/process.html'
const MONITOR_HTML_PATH = __dirname + '/../ui/monitor.html'
const SHUTDOWN_HTML_PATH = __dirname + '/../ui/shutdown.html'

const loadHTML = async (pageStr) => {
    switch (pageStr) {
        case 'info':
            return await fs.readFile(INFO_HTML_PATH, 'binary')
            break;
        
        case 'contacts':
            return await fs.readFile(CONTACTS_HTML_PATH, 'binary')
            break;
    
        case 'screenshot':
            return await fs.readFile(SCREENSHOT_HTML_PATH, 'binary')
            break;
    
        case 'files':
            return await fs.readFile(FILES_HTML_PATH, 'binary')
            break;
    
        case 'whatsapp':
            return await fs.readFile(WHATSAPP_HTML_PATH, 'binary')
            break;
    
        case 'process':
            return await fs.readFile(PROCESS_HTML_PATH, 'binary')
            break;
    
        case 'monitor':
            return await fs.readFile(MONITOR_HTML_PATH, 'binary')
            break;
    
        case 'shutdown':
            return await fs.readFile(SHUTDOWN_HTML_PATH, 'binary')
            break;
    
        default:
            break;
    }
}

module.exports = {
    loadHTML
}