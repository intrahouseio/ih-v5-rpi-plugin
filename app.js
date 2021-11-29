/**
 * app.js
 */

const util = require('util');
const fs = require('fs');

module.exports = async function (plugin) {
  const w1folder = '/sys/bus/w1/devices/';
  const gpiofolder = '/sys/class/gpio/';
  const period_t = plugin.params.data.period_t; 
  const period_d = plugin.params.data.period_d;

  let devList = [];
  let channels = await plugin.channels.get();
  if (channels.length == 0) await sendChannels(); // Отправить каналы на старте если их не прислали сверху
  await init();
  setInterval(readDiscrets, period_d);
  readDiscrets();
  setInterval(read1wire, period_t);
  plugin.channels.onChange(() => updateChannels());

  async function init() {
    devList = getDevList(); 
    for (let i =0; i<channels.length; i++) {
      if (channels[i].desc == 'DI' || channels[i].desc == 'DO') {
        if (!fs.existsSync(gpiofolder + channels[i].gpio)) {
          fs.promises.writeFile(gpiofolder+'/export', channels[i].gpioN);
          fs.promises.writeFile(gpiofolder + channels[i].gpio + '/direction', channels[i].desc=='DI' ? 'in' : 'out');
        }
      }
      let exist = 0;
      if (channels[i].desc == 'AI') {
        for (let j=0; j<devList.length; j++) {
          if (channels[i].id == devList[i]) exist = 1;
        }
        if (exist == 0 || devList.length == 0) {
          plugin.send({type:"removeChannels", data:[{id:channels[i].id}]})
          channels.splice(i, 1);
        };
      }
    }
  }
  
  async function updateChannels() {
    channels = await plugin.channels.get();
    for (let i =0; i<channels.length; i++) {
      if (channels[i].desc == 'DI' || channels[i].desc == 'DO') {
        if (!fs.existsSync(gpiofolder + channels[i].gpio)) {
          fs.promises.writeFile(gpiofolder + channels[i].gpio + '/direction', channels[i].desc=='DI' ? 'in' : 'out');
        }
      }    
    }
  }
  
  async function sendChannels() {
    // Определить свои каналы
    channels.push({ id: 'GPIO5', desc: 'DI', gpio: 'gpio5', gpioN: "5", value: 0, r: 1 });
    channels.push({ id: 'GPIO6', desc: 'DI', gpio: 'gpio6', gpioN: "6", value: 0, r: 1 });
    channels.push({ id: 'GPIO7', desc: 'DI', gpio: 'gpio7', gpioN: "7", value: 0, r: 1 });
    channels.push({ id: 'GPIO8', desc: 'DI', gpio: 'gpio8', gpioN: "8", value: 0, r: 1 });
    channels.push({ id: 'GPIO9', desc: 'DI', gpio: 'gpio9', gpioN: "9", value: 0, r: 1 });
    channels.push({ id: 'GPIO10', desc: 'DI', gpio: 'gpio10', gpioN: "10", value: 0, r: 1 });
    channels.push({ id: 'GPIO11', desc: 'DI', gpio: 'gpio11', gpioN: "11", value: 0, r: 1 });
    channels.push({ id: 'GPIO12', desc: 'DI', gpio: 'gpio12', gpioN: "12", value: 0, r: 1 });
    channels.push({ id: 'GPIO13', desc: 'DI', gpio: 'gpio13', gpioN: "13", value: 0, r: 1 });
    channels.push({ id: 'GPIO16', desc: 'DI', gpio: 'gpio16', gpioN: "16", value: 0, r: 1 });
    channels.push({ id: 'GPIO17', desc: 'DI', gpio: 'gpio17', gpioN: "17", value: 0, r: 1 });
    channels.push({ id: 'GPIO18', desc: 'DI', gpio: 'gpio18', gpioN: "18", value: 0, r: 1 });
    channels.push({ id: 'GPIO19', desc: 'DI', gpio: 'gpio19', gpioN: "19", value: 0, r: 1 });
    channels.push({ id: 'GPIO20', desc: 'DI', gpio: 'gpio20', gpioN: "20", value: 0, r: 1 });
    channels.push({ id: 'GPIO21', desc: 'DI', gpio: 'gpio21', gpioN: "21", value: 0, r: 1 });
    channels.push({ id: 'GPIO22', desc: 'DI', gpio: 'gpio22', gpioN: "22", value: 0, r: 1 });
    channels.push({ id: 'GPIO23', desc: 'DI', gpio: 'gpio23', gpioN: "23", value: 0, r: 1 });
    channels.push({ id: 'GPIO24', desc: 'DI', gpio: 'gpio24', gpioN: "24", value: 0, r: 1 });
    channels.push({ id: 'GPIO25', desc: 'DI', gpio: 'gpio25', gpioN: "25", value: 0, r: 1 });
    channels.push({ id: 'GPIO26', desc: 'DI', gpio: 'gpio26', gpioN: "26", value: 0, r: 1 });

    
    // Просканировать подключенные датчики 1-wire
    if (!fs.existsSync(w1folder)) {
      plugin.log('ADAPTER: Not found ' + w1folder + '. 1-wire driver is not installed!');
    } else {
      devList = getDevList();
      if (devList.length>0) {
        for (let i = 0; i<devList.length; i++) {
          channels.push({ id: devList[i], desc: 'AI', value: 0, r: 1 });
        }
      }
      plugin.log('1-wire devices: ' + devList);
    }

    // Отправить каналы на сервер
    plugin.send({ type: 'channels', data: channels });
  }

  function isDS18B20Sensor(name) {
    return (name && (name.substr(0, 2) == '28'));
  }

  function getDevList() {
    let arr = [];
    let stats;

    try {
      let filelist = fs.readdirSync(w1folder);
      if (!util.isArray(filelist)) {
        throw { message: "" };
      }

      for (var i = 0; i < filelist.length; i++) {
        if (!isDS18B20Sensor(filelist[i])) continue;

        stats = fs.statSync(w1folder + "/" + filelist[i]);
        if (stats.isDirectory()) {
          arr.push(filelist[i]);
        }
      }
      return arr;

    } catch (e) {
      logger.log("Error reading folder " + w1folder + ". " + e.message);
      process.exit();
    }
  }

async function read1wire() {
  let filename, value ;
    
	for (let i=0; i<channels.length; i++) {
          if (channels[i].desc == 'AI') {
	    filename = w1folder+channels[i].id+'/w1_slave';
	   
	    if ( isDS18B20Sensor( channels[i].id )) {
		val = null;
		try {
		    if (fs.existsSync(filename)) 	{
			// Открыть файл, читать значение
			value = await fs.promises.readFile(filename);
		        value = readTemp(value);
                    }
		} catch (e) {
		    plugin.log('ERR: '+e.message);
		}
                plugin.sendData([{id:channels[i].id, value}]);
	    }
          }
          if (channels[i].desc == 'DO') {
            filename = gpiofolder+channels[i].gpio+'/value';
            value = await fs.promises.readFile(filename);
            value = parseInt(value.toString());
	    plugin.sendData([{id:channels[i].id, value}]);
          }	
	}
    }	
function readTemp(data) {	
    let j, result;

	data = data.toString();
	if (data.indexOf('YES') > 0) {
	    j = data.indexOf('t=')
	    if (j>0) {
		result = parseInt(data.substr(j+2))/1000;
	    }	
	} 
	return result
    }

async function readDiscrets() {
  let data = [];
  for (let i =0; i<channels.length; i++) {
    if (channels[i].desc == 'DI') {
      let value = await fs.promises.readFile(gpiofolder+channels[i].gpio+'/value');
      value = parseInt(value.toString());
      if (value != channels[i].value) {
        //data.push({id: channels[i].id, value: value});
        plugin.sendData([{id: channels[i].id, value: value}]);
        channels[i].value = value;
      }
    }
  }
}


  function terminate() {
    console.log('TERMINATE PLUGIN');
    // Здесь закрыть все что нужно
  }

  // Получили команды управления от сервера
  plugin.onAct(message => {
    plugin.log('Action data=' + util.inspect(message));
    if (!message.data) return;

    const result = [];
    message.data.forEach(item => {
      if (item.id) {
        const chanObj = channels.find(chanItem => chanItem.id == item.id);
        if (chanObj) {
	        if (isNaN(item.value)) return
          chanObj.value = item.value;
          result.push({ id: item.id, value: item.value })
	        fs.promises.writeFile(gpiofolder+chanObj.gpio+'/value', Number(chanObj.value) ? '1' : '0');
        } else {
          plugin.log('Not found channel with id ' + item.id)
        }
      }
    });

    // Сразу отправляем на сервер - реально нужно отправить на железо
    if (result.length) plugin.sendData(result);
  });


  process.on('exit', terminate);
  process.on('SIGTERM', () => {
    terminate();
    process.exit(0);
  });
};
