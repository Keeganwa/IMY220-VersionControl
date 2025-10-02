Docker Commands:

Build the image:
docker build -t codebase-studio .

Run the container:
docker run -p 3000:3000 -p 5000:5000 codebase-studio

Stop the container:
docker ps (to get container ID)
docker stop <container-id>

Remove the container:
docker rm <container-id>

Remove the image:
docker rmi codebase-studio