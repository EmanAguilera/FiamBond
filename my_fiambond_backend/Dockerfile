# Step 1: Start with an official Node.js blueprint. Use a specific version for stability.
FROM node:18-alpine

# Step 2: Create a directory inside the container to put our code in.
WORKDIR /usr/src/app

# Step 3: Copy the list of ingredients (our package.json files) first.
# This is a smart trick. Docker will only re-run "npm install" if these files change.
COPY package*.json ./

# Step 4: Install the ingredients.
RUN npm install

# Step 5: Copy the rest of our application's code (like server.js).
COPY . .

# Step 6: Tell Docker that our application will be listening on port 3000.
EXPOSE 5000

# Step 7: This is the command that starts our engine when the container runs.
CMD [ "node", "server.js" ]