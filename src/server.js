import express from 'express';           // Express event driven server application
import bodyParser from 'body-parser';    // Allows JSON parsing of the HTTP request/response bodies.
import { MongoClient } from 'mongodb';   // Allows us to connect to backend MongoDB to persist articles upvote/comments data.
import path from 'path';

// First create the Express application.
const app = express();

// Tell Express where to serve static files from. Our React app frontend has been built and moved into the source folder.
app.use(express.static(path.join(__dirname, '/build')));

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


// Define MongoDB general access function to open a connection, access DB, perform specific passed in 
// function 'operations' e.g. update upvotes/comments. Then perform tear down.  
const withDB = async (operations, res) => {
    try {
        // Performs async connection to database on local host. Needs default connection params object containing at least useNewUrlParser.
        const client = await MongoClient.connect('mongodb://localhost:27017', 
                            {useNewUrlParser: true, useUnifiedTopology: true });
        // Created my-blog database via shell and added articles info data as a collection to it.
        // Now what to attach to my-blog DB to extract data from it.
        const db = client.db('my-blog');
  
        // Perform specific function of the caller.
        await operations( db );

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db!', error });
    }
}  // end withDB


// Retrieves articles info data from database. Use async because want to wait for DB to come back to us.
app.get('/api/articles/:name', async (req, res) => {
    
    // Call withDB passing in anonymous function which withDB calls passing in the connected db.
    withDB( async  (db) => {
       // Extract the article name from the URL name parameter. 
       const articleName = req.params.name;

       // Retrieving data from DB is also async so have to use await. Use article name to retrieve the articles info 
       const articleInfo = await db.collection('articles').findOne({ name: articleName });
       // Now send it back to frontend client.
       res.status(200).json(articleInfo);
    }, res );
}) // end get


// Adds a vote to the Article and sends back the response. Postman URL: http://localhost:8000/api/articles/learn-react/upvote
// Can see in PostMan response Upvote incrementing.
app.post('/api/articles/:name/upvote', async (req, res) => {
    // Call withDB passing in anonymous function which withDB calls passing in the connected db.
    withDB( async  (db) => {
        // Extract the article name from the URL name parameter. 
        const articleName = req.params.name;
         // Retrieving data from DB is also async so have to use await. Use article name to retrieve the articles info 
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        console.log(articleName + ' has this many upvotes ' + articleInfo.upvotes);
        // Can update a field entry using updateOne using articleName to ID it and 2nd argument defines what is updated and to what.
        await db.collection('articles').updateOne({name: articleName}, { '$set' : { upvotes: articleInfo.upvotes + 1 } } );
        // Retrieve the updated article info from the DB.
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        console.log(articleName + ' has this many upvotes ' + updatedArticleInfo.upvotes);
        // Response status 200 is server all good. Send back the new number of upvotes.
        res.status(200).json(updatedArticleInfo);
    }, res );
});

// Adds a comment to the articles comments array. Postman URL: http://localhost:8000/api/articles/learn-react/add-comment
// Postman JSON Post body: { "username" : "Fred", "text" : "I like this article"}. Can see Article Info comments array growing.
app.post('/api/articles/:name/add-comment', (req, res) => {
    // Get the user name and comment text from the HTTP post body.
    const { username, text } = req.body;
    const articleName = req.params.name;

    // Call withDB passing in anonymous function which withDB calls passing in the connected db.
    withDB( async  (db) => {
         // Retrieving data from DB is also async so have to use await. Use article name to retrieve the articles info 
         const articleInfo = await db.collection('articles').findOne({ name: articleName });
         // Can update a field entry using updateOne using articleName to ID it and 2nd argument defines what is updated and to what.
         // Comments is an array so can concatenate new comments to it returning a concatenated array.
         await db.collection('articles').updateOne({name: articleName}, 
                { '$set' : { comments: articleInfo.comments.concat( { username, text } ) } } );
         // Retrieve the updated article info from the DB.
         const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
 
        // Response status 200 is server all good. Send back the updated article info.
        res.status(200).send(updatedArticleInfo);
    }, res );
}); // end post

// Deletes an entry resets upvotes and clears comments.
app.get('/api/articles/:name/clear', (req, res) => {
    const articleName = req.params.name;

    // Call withDB passing in anonymous function which withDB calls passing in the connected db.
    withDB( async  (db) => {
         // Retrieving data from DB is also async so have to use await. Use article name to retrieve the articles info 
         const articleInfo = await db.collection('articles').findOne({ name: articleName });
         await db.collection('articles').updateOne({name: articleName}, 
            { '$set' : { comments: [] } } );
            await db.collection('articles').updateOne({name: articleName}, 
                { '$set' : { upvotes: 0 } } );
        // Retrieve the updated article info from the DB.
         const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
 
        // Response status 200 is server all good. Send back the updated article info.
        res.status(200).send(updatedArticleInfo);
    }, res );
}); // end post

// Tells Express that any other URL routes not handled above are to be routed to our react application.
// i.e. everything apart from api calls.
app.get('*', (req, res) => {
    res.sendfile(path.join(__dirname + '/build/index.html'));
});

// Start Node/Express listening on a particular port number. For the call-back just write out to the console.
app.listen(8000, () => console.log('Listening on Port 8000'));