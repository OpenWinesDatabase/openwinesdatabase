node {

    stage 'Checkout'
    def branch = env.BRANCH_NAME
    echo "current branch is ${branch}"
    checkout scm

	try {
	    stage 'Build'
		notifyStarted()
	    sh "/home/bas/.nvm/nvm.sh install 7.5.0"
	    sh "cd javascript; npm install; npm run build"
	    sh "./bin/activator ';clean;compile;stage'"
		notifySuccessful()
	} catch (e) {
		currentBuild.result = "FAILED"
		notifyFailed()
		throw e
	}

}

def notifyStarted() {
    slackSend (color: '#FFFF00', message: "STARTED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
}

def notifySuccessful() {
  	slackSend (color: '#00FF00', message: "SUCCESSFUL: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
}

def notifyFailed() {
    slackSend (color: '#FF0000', message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})")
}
