/*! 
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const axios = require('axios');
const crypto = require("crypto");
const { S3, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = new S3();
const bucketName = process.env.BUCKET_NAME;

exports.handler = async event => {
  let url;
  const randomId = crypto.randomBytes(16).toString("hex");

  // Mock HTTP Endpoint with a delay of 60 seconds for binary response
  const mockHttpUrl = "https://run.mocky.io/v3/e63ca0e5-53dd-483a-9186-1d7e4a2edb74?mocky-delay=60s"

  try {
    // Make HTTP Call & Capture Binary Response
    const response = await axios.get(mockHttpUrl, { responseType: "arraybuffer" });

    // Upload Response as S3 Object to bucket
    const objectName = `Response_Object_${randomId}.csv`;
    const data = await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: objectName,
      Body: response.data,
      ContentType: "text/csv"
    }));

    console.info("S3 Put Object Response: ", data);

    // Get PreSigned URL for the Object
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName
    });

    url = await getSignedUrl(s3, getObjectCommand, {
      expiresIn: 600
    });

    // All log statements are written to CloudWatch
    console.info("PreSigned URL from S3: ", url);
  } catch (err) {
    console.error("Error: ", err)
  }

  // Pass PreSigned URL to next step
  return url;
}
