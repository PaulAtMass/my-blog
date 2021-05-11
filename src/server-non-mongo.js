import express from 'express';
import bodyParser from 'body-parser';

// Define a temporary data structure to hold data received from client via HTTP requests.
// Use it to hold user comments and upvotes on articles.
const articlesInfo = {
    'learn-react': {
        upvotes: 0,
        comments: [],
    },
    'learn-node': {
        upvotes: 0,
        comments: [],
    },
    'my-thoughts-on-resumes': {
        upvotes: 0,
        comments: [],
    },
}

// First create the Express application.
const app = express();

// Tells Express to use Body Parser for JSON HTTP bodies so can extract content in req/res.
app.use(bodyParser.json());

// Associate a request/response with a URL /hello. So for a particular URL we can access
// the HTTP request, and define a HTTP response.
app.get('/hello', (req, res) => res.send('Hello There!'));
// Can use Postman to perform a Put with JSON string with my name as a property within it.
// In PostMan Post body add JSON {"name": "Paul"}
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}`));
// Can also extract URL parameters. In Postman Get URL = http://localhost:8000/hello/Paul 
app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));

// Adds a vote to the Article and sends back the response. Postman URL: http://localhost:8000/api/articles/learn-react/upvote
// Can see in PostMan response Upvote incrementing.
app.post('/api/articles/:name/upvote', (req, res) => {
    // Extract the article name from the URL name parameter. 
    const articleName = req.params.name;
    //Use article name to index the articles array and increment the upvote.     
    articlesInfo[articleName].upvotes += 1;
    // Response status 200 is server all good. Send back the new number of upvotes.
    res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`);
});

// Adds a comment to the articles comments array. Postman URL: http://localhost:8000/api/articles/learn-react/add-comment
// Postman JSON Post body: { "username" : "Fred", "text" : "I like this article"}. Can see Article Info comments array growing.
app.post('/api/articles/:name/add-comment', (req, res) => {
    // Get the user name and comment text from the HTTP post body.
    const { username, text } = req.body;
    const articleName = req.params.name;
    // Add the username and comment text to the articles info array.
    articlesInfo[articleName].comments.push({ username, text });
    // Response status 200 is server all good. Send back the updated article info.
    res.status(200).send(articlesInfo[articleName]);
});


// Start Node/Express listening on a particular port number. For the call-back just write out to the console.
app.listen(8000, () => console.log('Listening on Port 8000'));