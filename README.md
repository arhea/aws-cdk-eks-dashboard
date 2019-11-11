# AWS CDK EKS Kubernetes Dashboard

This module makes it easy to deploy and manage the Kubernetes Dashboard from AWS CDK for your EKS clusters. This module is designed based on the guidance provided in the [AWS EKS Workshop](https://eksworkshop.com/dashboard/dashboard/). This Construct will perform the following tasks:

- Deploy the Dashboard Kubernetes Manifest as defined by the open source project.

## Installation

You can install this with `npm` or `yarn`.

```bash
npm i `@arhea/aws-cdk-eks-dashboard` --save
```

or

```bash
yarn add `@arhea/aws-cdk-eks-dashboard`
```

## Usage

```typescript
import { ClusterAutoscaler } from '@arhea/aws-cdk-eks-dashboard';

const csa = new KubernetesDashboard(this, 'demo-dashboard', {
  cluster: cluster, // your EKS cluster
  version: 'v1.10.1' // the version of dashboard to deploy
});
```

| Option | Description | Default |
|---|---|---|
| `cluster` | The `@aws-cdk/aws-eks` cluster instance where this Dashboard should be deployed. | N/A |
| `version` | The version of the Dashboard to deploy. Find the latest version based on your Kubernetes [version here](https://github.com/kubernetes/dashboard).  | `v1.10.1` |
'

To access the dashboard run `kubectl proxy` and navigate to `http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/`. You will be prompted to login, select `Token`. Run the token command that was output from the `cdk deploy`, it should look something like this:

```bash
DemoEKS.demoeksclusterGetTokenCommand4F0892F7 = aws eks get-token --cluster-name cluster-815c9727-e20b-4bb6-807b-b3269575c82e --region us-east-2 --role-arn arn:aws:iam::<Account ID>:role/DemoEKS-AdminRole38563C57-1QETBYLXWQ2E --profile demo | jq -r '.status.token'
```

## Full Example

```typescript

// create a vpc to deploy eks
const vpc = new ec2.Vpc(this, 'example-vpc', {
  cidr: '10.1.0.0/16',
  maxAzs: 3,
  enableDnsHostnames: true,
  enableDnsSupport: true
});

// define an admin role to use, to enable kubectl
const clusterAdmin = new iam.Role(this, 'AdminRole', {
  assumedBy: new iam.AccountRootPrincipal()
});

// create the cluster
const cluster = new eks.Cluster(this, 'example-cluster', {
  mastersRole: clusterAdmin,
  vpc: vpc,
  vpcSubnets: [
    {
      subnetType: ec2.SubnetType.PRIVATE
    }
  ],
  defaultCapacity: 0
});


// create a custom node group
const ng = cluster.addCapacity('demo-ng1', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
  associatePublicIpAddress: false,
  bootstrapEnabled: true,
  desiredCapacity: 3,
  minCapacity: 3,
  maxCapacity: 6,
  mapRole: true
});

// create the kubernetes dashboard instance
const csa = new KubernetesDashboard(this, 'demo-dashboard', {
  cluster: cluster // your EKS cluster
});
```
