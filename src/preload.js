const mobile = require('./libs/mobile.js')
const utils = require('./libs/utils.js')
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld ('api', {
    loadHTML: utils.loadHTML,
    getBatteryLevel: mobile.getBatteryLevel,
    getAllInfo: mobile.getAllInfo,
    getDir: mobile.getDir,
    getGoogleContacts: mobile.getGoogleContacts,
    screenshot: mobile.screenshot,
    getRootDir: mobile.getRootDir,
    getJsonDir: mobile.getJsonDir,
    getWhatsappVoiceNotes: mobile.getWhatsappVoiceNotes,
    getWhatsAppImgSent: mobile.getWhatsAppImgSent,
    getWhatsAppVideoSent: mobile.getWhatsAppVideoSent,
    getWhatsAppImages: mobile.getWhatsAppImages,
    getWhatsAppVideos: mobile.getWhatsAppVideos,
    getProcessList: mobile.getProcessList,
    filterProcessName: mobile.filterProcessName,
    sendClick: mobile.sendClick,
    getDeviceInfo: mobile.getDeviceInfo,
    getWhatsAppStatuses: mobile.getWhatsAppStatuses,
    shutdown: mobile.shutdown,
    reboot: mobile.reboot
})
