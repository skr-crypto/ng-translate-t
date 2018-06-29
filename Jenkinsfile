// This Jenkinsfile uses the declarative syntax. If you need help, check:
// Overview and structure: https://jenkins.io/doc/book/pipeline/syntax/
// For plugins and steps:  https://jenkins.io/doc/pipeline/steps/
// For Github integration: https://github.com/jenkinsci/pipeline-github-plugin
// For credentials:        https://jenkins.io/doc/book/pipeline/jenkinsfile/#handling-credentials
// For credential IDs:     https://ci.ts.sv/credentials/store/system/domain/_/
// Tools (JDK, Maven):     https://ci.ts.sv/configureTools/
// Docker:                 https://jenkins.io/doc/book/pipeline/docker/
// Environment variables:  env.VARIABLE_NAME

pipeline {
    agent any // Or you could make the whole job or certain stages run inside docker
    triggers {
        issueCommentTrigger('^retest$')
    }

    // For Java people
    // tools {
    //    jdk 'oracle-java8u144-jdk'
    //    maven 'apache-maven-3.5.0'
    // }
    // environment {
    //     P12_PASSWORD = credentials 'client-cert-password'
    //     MAVEN_OPTS = "-Djavax.net.ssl.keyStore=/var/lib/jenkins/.m2/certs/jenkins.p12 \
    //                   -Djavax.net.ssl.keyStoreType=pkcs12 \
    //                   -Djavax.net.ssl.keyStorePassword=$P12_PASSWORD"
    // }

    stages {
        stage('Initialise PR') {
            when {
                expression { env.CHANGE_ID }
            }
            steps {
                // We need to reset the SonarQube status in the beginning
                githubNotify(status: 'PENDING', context: 'sonarqube', description: 'Not analysed')
            }
        }
        stage('Clone') {
            steps {
                checkout scm
            }
        }
        stage('Compile') {
            steps {
                sh 'bash compile.sh'
            }
        }

        // Keeping the different phases separate will give you per-phase statistics and a nicer overall structure
        // stage('Test') {
        //     steps {
        //         sh 'bash test.sh'
        //     }
        // }

        // stage('Docker') {
        //     environment {
        //         IMAGE_VERSION = "${env.CHANGE_ID ? 'ghprb-' : ''}${env.GIT_COMMIT}"
        //         IMAGE = "docker.tradeshift.net/tradeshift-frontend:$IMAGE_VERSION"
        //     }
        //     steps {
        //         sh "docker build $IMAGE docker && docker push $IMAGE"
        //         script {
        //             if (env.CHANGE_ID) {
        //                 pullRequest.comment("Pushed docker image: `$IMAGE`")
        //             }
        //         }
        //     }
        // }

        stage('Sonarqube') {
            when {
                anyOf {
                    branch 'master' // Only run Sonarqube on master...
                    expression { env.CHANGE_ID } // ... and PRs
                }
            }
            environment {
                SONAR_HOME = tool 'Scanner'
                GITHUB_TOKEN = credentials('sonarqube-integration')
            }
            steps {
                sonar()
            }
        }
    }
}

def sonar() {
    // Generic Sonarqube options
    def SONAR_OPTS = '-Dsonar.projectKey=ng-translate-t \
        -Dsonar.projectName=ng-translate-t \
        -Dsonar.projectVersion=1.0 \
        -Dsonar.sources=. \
        -Dsonar.java.binaries=target/classes '
    if (env.CHANGE_ID) { // If this is a PR, we need to set a few more parameters and handle NOSONAR
        if (pullRequest.body.contains('NOSONAR')) {
            githubNotify(status: 'FAILURE', context: 'sonarqube', description: 'Sonarqube skipped')
            return
        }
        SONAR_OPTS += "-Dsonar.analysis.mode=preview \
            -Dsonar.github.repository=Tradeshift/ng-translate-t \
            -Dsonar.github.pullRequest=${env.CHANGE_ID} \
            -Dsonar.github.oauth='$GITHUB_TOKEN_PSW' "
    }
    withSonarQubeEnv('TS Sonar') { // Inject Sonar config, e.g. server URL
        sh "$SONAR_HOME/bin/sonar-scanner $SONAR_OPTS"
    }
}
