================================================================================
IMY 220 PROJECT 2025 - CODEBASE STUDIO
Version Control Website
================================================================================

PROJECT INFORMATION
-------------------
Student Name: Keegan
Student Number: u22693760
Position_Surname: 13_Walker
Project Name: Codebase Studio
GitHub Repository: https://github.com/Keeganwa/IMY220-VersionControl

IMY220-VersionControl/
├── frontend/                    
│   ├── public/                 
│   │   ├── index.html          
│   │   ├── favicon.svg        
│   │   └── uploads/           
│   ├── src/                   
│   │   ├── components/        
│   │   ├── pages/             
│   │   ├── services/          
│   │   ├── styles.css         
│   │   ├── App.js             
│   │   └── index.js           
│   ├── Dockerfile             
│   └── package.json           
│
├── backend/                   
│   ├── models/                
│   ├── routes/                
│   ├── middleware/            
│   ├── uploads/               
│   ├── server.js              
│   ├── Dockerfile             
│   └── package.json           
│
├── database_export/           
│   └── versioncontrol/        
│
├     
└── readme.txt   

PREREQUISITES:
--------------
- Docker Desktop installed and running
- Docker Compose installed

DOCKER COMMANDS:
--------------
-   docker build -t codebase-studio .
-   docker run -p 4040:4040 -p 5000:5000 codebase-studio

MONGODB CONNECTION STRING:
--------------
mongodb+srv://codebase_db:Codebase_Pass@codebasestudio.omrkbre.mongodb.net/codebaseStudio?retryWrites=true&w=majority

Test the application at: http://localhost:4040
