/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { SFNClient, StartExecutionCommand } = require("@aws-sdk/client-sfn");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

const docClient = new DynamoDBClient();
const stepFunctions = new SFNClient();

const tableName = process.env.CONNECTIONS_TABLE;
const webSocketEndpoint = process.env.WEB_SOCKET_ENDPOINT;
const stateMachineArn = process.env.STATE_MACHINE_ARN;

exports.handler = async event => {  
  if (event.httpMethod !== 'GET') {
    console.error(`HTTP method ${event.httpMethod} not supported`);
    throw new Error(`Handler only accept GET method, you tried: ${event.httpMethod}`);
  }

  // Invoke Step Functions & Capture Step Functions Execution ARN
  const startExecCommand = new StartExecutionCommand({ stateMachineArn, input: JSON.stringify({ webSocketEndpoint }) });
  const executionResult = await stepFunctions.send(startExecCommand);
  console.info(`Execution Result: ${JSON.stringify(executionResult)}`);

  // Insert Step Functions Execution ARN to DynamoDB as PK
  const item = marshall({ executionArnId: executionResult.executionArn });
  const result = await docClient.send(new PutItemCommand({ TableName: tableName, Item: item }));

  console.info(`Successfully Inserted in DynamoDB: ${result}`);

  // Capture WebSocket Endpoint URL & Send both as response to client
  const body = {
    executionArn: executionResult.executionArn,
    webSocketEndpoint
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(body)
  };

  // All log statements are written to CloudWatch
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}