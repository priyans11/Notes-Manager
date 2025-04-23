const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises; // Use promises for better error handling
const { log } = require('console');

app.set('view engine','ejs');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname,"public")));

// Ensure required directories exist
async function ensureDirectoriesExist() {
    try {
        // Check and create files directory
        try {
            await fs.access('./files');
        } catch (err) {
            console.log('Creating files directory...');
            await fs.mkdir('./files');
        }
        
        // Check and create recyclebin directory
        try {
            await fs.access('./recyclebin');
        } catch (err) {
            console.log('Creating recyclebin directory...');
            await fs.mkdir('./recyclebin');
        }
        
        console.log('All required directories are available');
        return true;
    } catch (err) {
        console.error('Failed to create required directories:', err);
        return false;
    }
}

app.get('/', async function(req, res) {
    try {
        const files = await fs.readdir('./files');
        res.render('index', { files });
    } catch (err) {
        // Create directory if it doesn't exist
        if (err.code === 'ENOENT') {
            await fs.mkdir('./files');
            res.render('index', { files: [] });
        } else {
            console.error('Error in root route:', err);
            res.status(500).send('Error loading files: ' + err.message);
        }
    }
});

app.get('/bin', async function(req, res) {
    try {
        const files = await fs.readdir('./recyclebin');
        res.render('bin', { files });
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir('./recyclebin');
            res.render('bin', { files: [] });
        } else {
            res.status(500).send('Error loading recycle bin');
        }
    }
});

app.post('/edit/:filename', async function(req, res) {
    try {
        await fs.writeFile(`./files/${req.params.filename}`, req.body.details);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/delete/:filename', async function(req, res) {
    try {
        await fs.rename(`./files/${req.params.filename}`, `./recyclebin/${req.params.filename}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/restore/:filename', async function(req, res) {
    try {
        await fs.rename(`./recyclebin/${req.params.filename}`, `./files/${req.params.filename}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/permanent-delete/:filename', async function(req, res) {
    try {
        await fs.unlink(`./recyclebin/${req.params.filename}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/file/:filename', async function(req, res) {
    try {
        const filedata = await fs.readFile(`./files/${req.params.filename}`, "utf-8");
        res.render('show', {
            filename: req.params.filename,
            filedata: filedata
        });
    } catch (err) {
        res.status(404).send('File not found or could not be read');
    }
});

app.post('/create', async function(req, res) {
    try {
        const fileName = req.body.title.trim().replace(/[^a-zA-Z0-9]/g, '_');
        await fs.writeFile(`./files/${fileName}.txt`, req.body.details);
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error creating note');
    }
});

// Improved server startup with better error handling
const PORT = process.env.PORT || 3000;

async function startServer() {
    const directoriesReady = await ensureDirectoriesExist();
    
    if (!directoriesReady) {
        console.error('Cannot start server due to directory initialization failure');
        process.exit(1);
    }
    
    try {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log('Press Ctrl+C to stop the server');
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Start the server
startServer().catch(err => {
    console.error('Unhandled error during server startup:', err);
    process.exit(1);
});