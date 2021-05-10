/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

exports.handler = async event => {
  const { connectionId, preSignedUrl, webSocketEndpoint } = event;
  const stage = webSocketEndpoint.split("/").pop();

  const apiGatewayManagementAPIClient = new ApiGatewayManagementApiClient({
    apiVersion: "2018-11-29",
    endpoint: webSocketEndpoint.replace("wss://", "https://")
  });

  // Workaround for issue: https://github.com/aws/aws-sdk-js-v3/issues/1830
  apiGatewayManagementAPIClient.middlewareStack.add(
    (next) =>
      async (args) => {
        args.request.path = stage + args.request.path;
        return await next(args);
      },
    { step: "build" },
  );

  try {
    await apiGatewayManagementAPIClient.send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: preSignedUrl }));
  } catch (e) {
    if (e.statusCode === 410) {
      console.error(`Found stale connection: ${connectionId}`);
    } else {
      throw e;
    }
  }

  return { statusCode: 200, body: 'Data sent.' };
};