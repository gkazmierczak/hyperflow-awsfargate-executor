import { CreateClusterCommand } from "@aws-sdk/client-ecs";

import { RegisterTaskDefinitionCommand } from "@aws-sdk/client-ecs";
const CPU_DEFAULT = "512";
const MEMORY_DEFAULT = "1024";

const ROLE_ARN_DEFAULT = "arn:aws:iam::471112732460:role/LabRole";

const MONTAGE_WORKER_IMAGE =
    "471112732460.dkr.ecr.us-east-1.amazonaws.com/handler-montage:latest";

const TASK_DEFINITION_BASE = {
    taskRoleArn: ROLE_ARN_DEFAULT,
    executionRoleArn: ROLE_ARN_DEFAULT,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    cpu: CPU_DEFAULT,
    memory: MEMORY_DEFAULT,
    runtimePlatform: {
        cpuArchitecture: "X86_64",
        operatingSystemFamily: "LINUX",
    },
};

function getLogConfiguration(name) {
    return {
        logDriver: "awslogs",
        options: {
            "awslogs-group": `/ecs/${name}`,
            "awslogs-create-group": "true",
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "ecs",
        },
        secretOptions: [],
    };
}

async function createDataProviderTaskDefinition(ecsClient, efsData) {
    const taskDefinition = {
        ...TASK_DEFINITION_BASE,
        family: "hyperflow-data-provider",

        containerDefinitions: [
            {
                name: "data",
                image: "471112732460.dkr.ecr.us-east-1.amazonaws.com/data-provider-container:latest",
                cpu: 0,
                portMappings: [
                    {
                        name: "data-80-tcp",
                        containerPort: 80,
                        hostPort: 80,
                        protocol: "tcp",
                        appProtocol: "http",
                    },
                ],
                essential: false,
                environment: [],
                environmentFiles: [],
                mountPoints: [],
                volumesFrom: [],
                ulimits: [],
                logConfiguration: getLogConfiguration("data"),
                systemControls: [],
            },
            {
                name: "script",
                image: "471112732460.dkr.ecr.us-east-1.amazonaws.com/data-provider-script:latest",
                cpu: 0,
                portMappings: [],
                essential: true,
                environment: [],
                environmentFiles: [],
                mountPoints: [
                    {
                        sourceVolume: "efsdata",
                        containerPath: "/mnt/data",
                        readOnly: false,
                    },
                ],
                volumesFrom: [
                    {
                        sourceContainer: "data",
                        readOnly: true,
                    },
                ],
                systemControls: [],
                logConfiguration: getLogConfiguration("data-provider-script"),
            },
        ],
        volumes: [
            {
                name: "efsdata",
                efsVolumeConfiguration: {
                    fileSystemId: efsData.FileSystemId,
                    rootDirectory: "/",
                },
            },
        ],
    };
    try {
        const data = await ecsClient.send(
            new RegisterTaskDefinitionCommand(taskDefinition),
        );

        console.log(
            "Data provider worker task definition registered successfully:",
            data.taskDefinition,
        );
        return data.taskDefinition;
    } catch (err) {
        console.error("Error registering data provider task definition:", err);
    }
}

async function createMontageWorkerTaskDefinition(ecsClient, efsData) {
    const taskDefinition = {
        ...TASK_DEFINITION_BASE,
        family: "hyperflow-montage-worker",
        containerDefinitions: [
            {
                name: "montage-worker",
                image: MONTAGE_WORKER_IMAGE,
                cpu: 0,
                portMappings: [
                    {
                        name: "hyperflow-montage-worker-80-tcp",
                        containerPort: 80,
                        hostPort: 80,
                        protocol: "tcp",
                        appProtocol: "http",
                    },
                ],
                essential: true,
                environment: [],
                environmentFiles: [],
                mountPoints: [
                    {
                        sourceVolume: "efs-volume",
                        containerPath: "/mnt/data",
                        readOnly: false,
                    },
                ],
                volumesFrom: [],
                ulimits: [],
                logConfiguration: getLogConfiguration(
                    "hyperflow-montage-worker",
                ),
                systemControls: [],
            },
        ],
        volumes: [
            {
                name: "efs-volume",
                efsVolumeConfiguration: {
                    fileSystemId: efsData.FileSystemId,
                    rootDirectory: "/",
                },
            },
        ],
    };

    try {
        const data = await ecsClient.send(
            new RegisterTaskDefinitionCommand(taskDefinition),
        );

        console.log(
            "Montage worker task definition registered successfully:",
            data.taskDefinition,
        );
        return data.taskDefinition;
    } catch (err) {
        console.error("Error registering montage worker task definition:", err);
    }
}

export async function createTaskDefinitions(ecsClient, efsData) {
    const [montageWorkerTaskDefinition, dataProviderTaskDefinition] =
        await Promise.all([
            createMontageWorkerTaskDefinition(ecsClient, efsData),
            createDataProviderTaskDefinition(ecsClient, efsData),
        ]);
    return {
        worker: montageWorkerTaskDefinition,
        dataProvider: dataProviderTaskDefinition,
    };
}

export async function setupCluster(ecsClient) {
    // Define cluster parameters
    const params = {
        clusterName: "hyperflow-cluster",
    };

    try {
        // Create the cluster
        const data = await ecsClient.send(new CreateClusterCommand(params));
        console.log("Cluster created successfully:", data.cluster);
        return data.cluster;
    } catch (err) {
        console.error("Error creating cluster:", err);
    }
}
