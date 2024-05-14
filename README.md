# AWS Fargate executor for Hyperflow

## Dockerizing application
Requirements: git, nodejs, docker

Clone this repository

npm install

docker build -t handler .

## Deploying docker image on AWS Fargate
Make sure your AWS credentials are set up correctly (`~/.aws/credentials` exists and has proper values)

Requirements: AWS CLI

Create ECR repository for docker image through aws console or CLI:
`aws ecr create-repository --repository-name handler`

You can replace `handler` with other name of your choice (here and in subsequent usages)

Now you need to push docker image onto ECR repository. Log in to the AWS website and navigate to the Repositories tab under the Elastic Container Service. You should able to see the repository you have just created. Next, click on the repository and click on View Push Commands to get a list of commands that you need to run to be able to push your image to ECR. Follow the steps as they are given.

Example steps:

`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com`

  
`sudo docker tag handler:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/handler:latest`

`sudo docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/handler:latest`

## Create Fargate application

Create a Fargate cluster and EFS Volume, then add a new task definition:


Click get started, then select custom container and configure it. Give it some name, image URI can be found in ECR repository, for example:

123456789.dkr.ecr.eu-west-1.amazonaws.com/handler:latest

Click edit on Task definition - set some task definition name, and create proper task execution role which enables using S3 and EFS. 

Under Storage add Volume of type EFS for one you created, and a mount point under `/mnt/data`

You don't need to define anything else for now and can finish the creation. 

## Running Hyperflow with AWS Fargate
Update your workflow so it uses awsFargateCommand function. 
Remember to update config file - tasks_mapping should have a value corresponding to arn of task you just created.

Afterwards you can run your workflow using `hflow run .`

For more details check hyperflow page: https://github.com/hyperflow-wms/hyperflow. 
