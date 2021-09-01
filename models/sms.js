const request = require('request');

const options = {
    method: 'GET',
    url: 'https://kapsystem-bulksmsapi-v1.p.rapidapi.com/api/command',
    qs: { username: 'deepaapcog', password: 'Apcogsysdeepakini221995!', cmd: 'X' },
    headers: {
        'x-rapidapi-key': 'd0e5a05f32msh0517f137fcd0c5ep1ea71ajsnd687fc161fd5',
        'x-rapidapi-host': 'kapsystem-bulksmsapi-v1.p.rapidapi.com',
        useQueryString: true
    }
};

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
});



// const http = require("https");

// const options = {
// 	"method": "GET",
// 	"hostname": "kapsystem-bulksmsapi-v1.p.rapidapi.com",
// 	"port": null,
// 	"path": "/api/command?username=test&password=test&cmd=X",
// 	"headers": {
// 		"x-rapidapi-key": "d0e5a05f32msh0517f137fcd0c5ep1ea71ajsnd687fc161fd5",
// 		"x-rapidapi-host": "kapsystem-bulksmsapi-v1.p.rapidapi.com",
// 		"useQueryString": true
// 	}
// };

// const req = http.request(options, function (res) {
// 	const chunks = [];

// 	res.on("data", function (chunk) {
// 		chunks.push(chunk);
// 	});

// 	res.on("end", function () {
// 		const body = Buffer.concat(chunks);
// 		console.log(body.toString());
// 	});
// });

// req.end();