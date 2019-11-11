import cdk = require('@aws-cdk/core');
import eks = require('@aws-cdk/aws-eks');

/**
 * The properties for the Cluster Autoscaler.
 */
export interface KubernetesDashoardProps {

  /**
   * The EKS cluster to deploy the dashboard to.
   *
   * @default none
   */
  cluster: eks.Cluster;

  /**
   * The version of the kubernetes dashboard to deploy.
   *
   * @default v1.10.1
   */
  version?: string;

}

export class KubernetesDashoard extends cdk.Construct {

  /**
   * The Kubernetes Resource that defines the Kubernetes Dashboard K8s resources.
   */
  public readonly kubernetesDashboard: eks.KubernetesResource

  constructor(scope: cdk.Construct, id: string, props: KubernetesDashoardProps) {
    super(scope, id);

    // default the version to the latest version
    if(!props.version) {
      props.version = 'v1.10.1';
    }

    this.kubernetesDashboard = new eks.KubernetesResource(this, 'dashboard-manifest', {
      cluster: props.cluster,
      manifest: [
        {
          apiVersion: 'v1',
          kind: 'Secret',
          metadata: {
            name: 'kubernetes-dashboard-certs',
            namespace: 'kube-system',
            labels: {
              'k8s-app': 'kubernetes-dashboard'
            }
          },
          type: 'Opaque'
        },
        {
          apiVersion: 'v1',
          kind: 'ServiceAccount',
          metadata: {
            name: 'kubernetes-dashboard',
            namespace: 'kube-system',
            labels: {
              'k8s-app': 'kubernetes-dashboard'
            }
          }
        },
        {
          apiVersion: 'rbac.authorization.k8s.io/v1',
          kind: 'Role',
          metadata: {
            name: 'kubernetes-dashboard-minimal',
            namespace: 'kube-system'
          },
          rules: [
            {
              apiGroups: [''],
              resources: ['secrets'],
              verbs: ['create']
            },
            {
              apiGroups: [''],
              resources: ['configmaps'],
              verbs: ['create']
            },
            {
              apiGroups: [''],
              resources: ['secrets'],
              resourceNames: ['kubernetes-dashboard-key-holder', 'kubernetes-dashboard-certs'],
              verbs: ['get', 'update', 'delete']
            },
            {
              apiGroups: [''],
              resources: ['configmaps'],
              resourceNames: ['kubernetes-dashboard-settings'],
              verbs: ['get', 'update']
            },
            {
              apiGroups: [''],
              resources: ['services'],
              resourceNames: ['heapster'],
              verbs: ['proxy']
            },
            {
              apiGroups: [''],
              resources: ['services/proxy'],
              resourceNames: ['heapster', 'http:heapster:', 'https:heapster:'],
              verbs: ['get']
            }
          ]
        },
        {
          apiVersion: 'rbac.authorization.k8s.io/v1',
          kind: 'RoleBinding',
          metadata: {
            name: 'kubernetes-dashboard-minimal',
            namespace: 'kube-system'
          },
          roleRef: {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'Role',
            name: 'kubernetes-dashboard-minimal'
          },
          subjects: [
            {
              kind: 'ServiceAccount',
              name: 'kubernetes-dashboard',
              namespace: 'kube-system'
            }
          ]
        },
        {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          metadata: {
            name: 'kubernetes-dashboard',
            namespace: 'kube-system',
            labels: {
              'k8s-app': 'kubernetes-dashboard'
            }
          },
          spec: {
            replicas: 1,
            revisionHistoryLimit: 10,
            selector: {
              matchLabels: {
                'k8s-app': 'kubernetes-dashboard'
              }
            },
            template: {
              metadata: {
                labels: {
                  'k8s-app': 'kubernetes-dashboard'
                }
              },
              spec: {
                serviceAccountName: 'kubernetes-dashboard',
                containers: [
                  {
                    name: 'kubernetes-dashboard',
                    image: 'k8s.gcr.io/kubernetes-dashboard-amd64:' + props.version,
                    ports: [
                      {
                        containerPort: 8443,
                        protocol: 'TCP'
                      }
                    ],
                    args: [
                      '--auto-generate-certificates'
                    ],
                    volumeMounts: [
                      {
                        name: 'kubernetes-dashboard-certs',
                        mountPath: '/certs'
                      },
                      {
                        name: 'tmp-volume',
                        mountPath: '/tmp'
                      }
                    ],
                    livenessProbe: {
                      httpGet: {
                        scheme: 'HTTPS',
                        path: '/',
                        port: 8443
                      },
                      initialDelaySeconds: 30,
                      timeoutSeconds: 30
                    },
                  }
                ],
                volumes: [
                  {
                    name: 'kubernetes-dashboard-certs',
                    secret: {
                      secretName: 'kubernetes-dashboard-certs'
                    }
                  },
                  {
                    name: 'tmp-volume',
                    emptyDir: {}
                  }
                ],
                tolerations: [
                  {
                    key: 'node-role.kubernetes.io/master',
                    effect: 'NoSchedule'
                  }
                ]
              }
            }
          }
        },
        {
          apiVersion: 'v1',
          kind: 'Service',
          metadata: {
            name: 'kubernetes-dashboard',
            namespace: 'kube-system',
            labels: {
              'k8s-app': 'kubernetes-dashboard'
            }
          },
          spec: {
            ports: [
              {
                port: 443,
                targetPort: 8443
              }
            ],
            selector: {
              'k8s-app': 'kubernetes-dashboard'
            }
          }
        },
      ]
    });

  }

}
