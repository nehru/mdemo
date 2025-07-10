pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent (your main Jenkins server for now)

    stages {
        stage('Checkout Code') { // A stage to fetch your code from Git
            steps {
                echo 'Starting Git checkout...'
                // This command tells Jenkins to clone the repository configured in the job settings.
                // It will clone https://github.com/nehru/mdemo.git into the workspace.
                checkout scm
                echo 'Code checked out successfully!'
            }
        }

        stage('Build and Verify') { // A stage to run some commands and verify
            steps {
                echo 'Running build and verification steps...'
                // This is a Windows Batch command. 'dir' lists directory contents.
                bat 'dir'
                // This command checks if Git is properly installed and accessible on the Jenkins agent.
                bat 'git --version'
                echo 'Basic verification complete.'
            }
        }
    }
}
