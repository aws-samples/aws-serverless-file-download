/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { DynamoDBClient, ScanCommand, BatchWriteItemCommand } = require("@aws-sdk/client-dynamodb");
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async event => {
  console.info(`On Connect Event Object: ${JSON.stringify(event)}`);

  const scanParams = {
    TableName: process.env.TABLE_NAME,
    ProjectionExpression: "executionArnId",
    FilterExpression: "#conn = :conn_id",
    ExpressionAttributeNames: {
      "#conn": "connectionId",
    },
    ExpressionAttributeValues: {
      ":conn_id": { S: event.requestContext.connectionId }
    }
  };

  const { Items } = await ddb.send(new ScanCommand(scanParams));
  console.info(`Items from Scan: ${JSON.stringify(Items)}`);

  if (!Items || Items.length == 0) {
    return { statusCode: 204, body: JSON.stringify({ message: 'No connections to Delete..' }) };
  }

  const batchWriteItemInput = {
    RequestItems: {
      [process.env.TABLE_NAME]: Items.map(item => {
        return {
          DeleteRequest: {
            Key: item
          }
        }
      })
    }
  };

  try {
    await ddb.send(new BatchWriteItemCommand(batchWriteItemInput));
  } catch (err) {
    console.error(`Failed to disconnect.. ${JSON.stringify(err)}`);
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Disconnected.' }) };
};