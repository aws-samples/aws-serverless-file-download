/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { SFNClient } = require("@aws-sdk/client-sfn");

describe('Test async-download handler', () => {
  let putSpy, sfnSpy, lambda;

  beforeAll(() => {
    process.env.WEB_SOCKET_ENDPOINT = "wss://myWebSocketEndpoint";
    putSpy = jest.spyOn(DynamoDBClient.prototype, 'send');
    sfnSpy = jest.spyOn(SFNClient.prototype, 'send');

    // require lambda after setting variables in process.env in order to use them outside the handler
    lambda = require('../../../src/handlers/async-download/app.js');
  });

  afterAll(() => {
    putSpy.mockRestore();
    sfnSpy.mockRestore();
  });

  it('should return execution arn and websocket endpoint', async () => {
    const executionResult = { executionArn: "aws:arn:account:region:executionArn" };

    sfnSpy.mockReturnValue(Promise.resolve(executionResult));
    putSpy.mockReturnValue(Promise.resolve({ status: 200 }));

    const event = {
      httpMethod: 'GET'
    }

    // Invoke helloFromLambdaHandler() 
    const result = await lambda.handler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify({ 
        ...executionResult,
        webSocketEndpoint: "wss://myWebSocketEndpoint"
      })
    };

    // Compare the result with the expected result 
    expect(result).toEqual(expectedResult);
  });
});
