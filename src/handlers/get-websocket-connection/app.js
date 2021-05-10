/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const ddb = new DynamoDBClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

exports.handler = async event => {
  let connectionId;
  
  console.info(`ExecutionId from Parameter: ${JSON.stringify(event)}`);

  const params = {
    TableName: process.env.CONNECTIONS_TABLE,
    Key: marshall({
      executionArnId: event.Execution
    }),
    ProjectionExpression: 'connectionId'
  }

  try {
    const { Item } = await ddb.send(new GetItemCommand(params));
    const item = unmarshall(Item);
    if (item?.connectionId) {
      connectionId = item.connectionId;
    }
  } catch (e) {
    return null;
  }

  return connectionId;
};