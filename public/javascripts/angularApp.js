var app = angular.module('flapperNews', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {

	$stateProvider
		.state('home', {
		url: '/home',
		templateUrl: '/home.html',
		controller: 'MainCtrl',
		resolve: {
			postPromise: ['posts', function(posts) {
				return posts.getAll();
			}]
		}
	}).state('posts', {
		url: '/posts/{id}',
		templateUrl: '/posts.html',
		controller: 'PostsCtrl',
		resolve: {
			post: ['$stateParams', 'posts', function($stateParams, posts) {
				return posts.get($stateParams.id);
			}]
		}
	}).state('login', {
		url: '/login',
		templateUrl: '/login.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	}).state('register', {
		url: '/register',
		templateUrl: '/register.html',
		controller: 'AuthCtrl',
		onEnter: ['$state', 'auth', function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]
	}).state('payment', {
		url: '/payment',
		templateUrl: '/payment.html',
		controller: 'PayCtrl'
	});

	$urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
	var factory = {};

	factory.saveToken = function(token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	factory.getToken = function() {
		return $window.localStorage['flapper-news-token'];
	};

	factory.isLoggedIn = function() {
		var token = factory.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	factory.currentUser = function() {
		var token = factory.getToken(),
			payload;

		if (token) {
			payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.username;
		} else {
			return false;
		}

	};

	factory.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			factory.saveToken(data.token);
		});
	};

	factory.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			factory.saveToken(data.token);
		});
	};

	factory.logOut =function(user) {
		$window.localStorage.removeItem('flapper-news-token');
	};

	return factory;

}]);

app.factory('posts', ['$http', 'auth', function($http, auth) {

	var factory = {};

	factory.posts = [
		{
			title:'post 1',
			link:'http://www.google.com/',
			upvotes: 12,
			comments: [
				{author: 'Joe', body: 'Cool post!', upvotes: 0},
				{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
			]
		},
		{
			title:'post 2',
			upvotes: -3,
			comments: [
				{author: 'Joe', body: 'Cool post!', upvotes: 0},
				{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
			]
		},
		{
			title:'post 3',
			upvotes: 43,
			comments: [
				{author: 'Joe', body: 'Cool post!', upvotes: 0},
				{author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
			]
		}
	];

	factory.get = function(id) {
		return $http.get('/posts/'+ id).then(function(res) {
			return res.data;
		});
	};

	factory.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, factory.posts);
		});
	};

	factory.create = function(post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			factory.posts.push(data);
		});
	};

	factory.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			post.upvotes += 1;
		});
	};

	factory.downvote = function(post) {
		return $http.put('/posts/' + post._id + '/downvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			post.downvotes += 1;
		});
	};

	factory.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		});
	};

	factory.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			comment.upvotes += 1;
		});
	};

	factory.downvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvote', null, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			comment.downvotes += 1;
		});
	};

	return factory;

}]);

app.factory('pay', ['$http', 'auth', function($http, auth) {

	var factory = {};

	/* factory.payment = function() {
		return $http.get('/payments').success(function(data) {
			angular.copy(data, factory.payments);
		});
	};
	*/
	factory.charge = function(payment) {
		return $http.post('/payments', payment, {
			headers: {Authorization: 'Bearer '+ auth.getToken()}
		}).success(function(data){
			factory.payments.push(data);
		});
	};


	return factory;

}]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
	function($scope, posts) {
		$scope.test = 'Hello!';

		$scope.posts = posts.posts;

		$scope.addPost = function() {
			if (!$scope.title) {
				return;
			}
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(post) {
			posts.upvote(post);
		};

		$scope.incrementDownvotes = function(post) {
			posts.downvote(post);
		};
	}
]).controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	function($scope, posts, post) {
		$scope.post = post;

		$scope.addComment = function() {
			if ($scope.body === '') {
				return;
			}
			posts.addComment(post._id, {
				body: $scope.body,
				author: 'user'
			}).success(function(comment) {
				$scope.post.comments.push(comment);
			});
			$scope.body = '';
		};

		$scope.incrementUpvotes = function(comment){
			posts.upvoteComment(post, comment);
		};

		$scope.incrementDownvotes = function(comment){
			posts.downvoteComment(post, comment);
		};
	}
]).controller('PayCtrl', [
	'$scope',
	'payments',
	function($scope, payments) {
		$scope.payments = {};

		$scope.payments = payments.payments;

		$scope.charge = function() {
			if (!$scope.amt) {
				return;
			}
			payments.charge({
				ccno: $scope.ccno,
				ccv: $scope.ccv,
				amt: $scope.amt,
				exp: $scope.exp
			});
			$scope.ccno = '';
			$scope.ccv = '';
			$scope.amt = '';
			$scope.exp = '';
		};
	}
]).controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function() {
			auth.register($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};

		$scope.logIn = function() {
			auth.logIn($scope.user).error(function(error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			});
		};
	}
])
.controller('NavCtrl', [
	'$scope',
	'auth',
	function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}
]);