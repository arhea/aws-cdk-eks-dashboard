#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { AwsCdkEksDashboardStack } from '../lib/aws-cdk-eks-dashboard-stack';

const app = new cdk.App();
new AwsCdkEksDashboardStack(app, 'AwsCdkEksDashboardStack');
