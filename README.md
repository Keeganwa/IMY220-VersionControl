DOCKER COMMANDS FOR CODEBASE STUDIO - DELIVERABLE 2

Build the Docker image:
docker build -t codebase-studio .

Run the Docker container:
docker run -p 4040:4040 -p 5000:5000 codebase-studio

Stop the container:
docker ps (to get container ID)
docker stop <container-id>

Remove the container:
docker rm <container-id>

Remove the image:
docker rmi codebase-studio

Access the application:
Frontend: http://localhost:4040
Backend API: http://localhost:5000/api/health

MongoDB Connection String:
mongodb+srv://codebase_db:Codebase_Pass@codebasestudio.omrkbre.mongodb.net/codebaseStudio?retryWrites=true&w=majority

Test the complete application:
1. Register a new user account
2. Create projects with tags and descriptions
3. View local/global activity feeds
4. Search for projects and users
5. Check out and check in projects
6. View project details and activity