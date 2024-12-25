import * as cdk from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Billing, BillingMode, Table, TableClass, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbProps: TableProps = {
      partitionKey: { name: 'id', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableClass: TableClass.STANDARD,
      tableName: 'product',
      removalPolicy: cdk.RemovalPolicy.DESTROY
    };
    

    let productTable =  new Table(this, "productTable", dynamoDbProps);

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-cdk'
        ]
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName
      },
      runtime: Runtime.NODEJS_LATEST
    };
     
    let lamda = new NodejsFunction(this, "productService", {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsFunctionProps
    } );

    productTable.grantReadWriteData(lamda);

    const apiGateway = new LambdaRestApi(this, 'productAPI', {
      restApiName: 'Product Service',
      handler: lamda,
      proxy: false
    });

    const product = apiGateway.root.addResource('product');

    product.addMethod("GET");
    product.addMethod("POST");

    const singleProduct = product.addResource('{id}'); 

    singleProduct.addMethod("GET");
    singleProduct.addMethod("PUT");
    singleProduct.addMethod("DELETE");
  }
}
