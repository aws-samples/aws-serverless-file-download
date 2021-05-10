/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async event => {
  console.info(`On Connect Event Object: ${JSON.stringify(event)}`);

  const putItemCommand = new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall({
      executionArnId: event.headers["X-StateMachine-ExecutionArn"],
      connectionId: event.requestContext.connectionId
    })
  });

  try {
    await ddb.send(putItemCommand);
  } catch (err) {
    return { statusCode: 500, body: `Failed to connect: ${JSON.stringify(err)}` };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Connected...' })
  };
};