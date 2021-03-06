/*
  Meant to be run with faucet:

    npm install -g faucet
    faucet
*/

/*
  These tests are not meant to be run often (e.g. via Travis),
  as they hit the live internet, and hit domains whose security
  properties could change.

  They are here to be used during development and debugging,
  during which other production testing sites should be used
  if something seems to have changed, like SSL Labs.

  TODO: Freeze test cases.
  TODO: Test on Alexa top X for crashes.
*/

var test = require("tape");
var shaaaaa = require("../shaaaaa");

var basics = [
  {
    name: "SHA-2, Comodo 3-chain, konklone.com",
    domain: "konklone.com",
    algorithm: "sha256",
    good: true
  },
  {
    name: "SHA-2, StartSSL 2-chain, oversight.io",
    domain: "oversight.io",
    algorithm: "sha256",
    good: true
  },
  {
    name: "SHA-1, Digicert 2-chain, facebook.com",
    domain: "facebook.com",
    algorithm: "sha1",
    good: false
  }
];

basics.forEach(function(basic) {
  test(basic.name, function(t) {
    shaaaaa.from(basic.domain, function(err, answer) {
      if (err) t.fail("Error checking domain: " + err);

      t.equal(basic.algorithm, answer.cert.algorithm, "Wrong algorithm.");
      t.equal(basic.good, answer.cert.good);
      t.equal(basic.domain, answer.domain)
      t.end();
    });
  });
});

/*
  for intermediates, later:

  twitter is SHA-2 but with SHA-1 intermediate
    https://www.ssllabs.com/ssltest/analyze.html?d=twitter.com&s=199.59.150.39

  facebook is SHA-1 with SHA-1 intermediate
    https://www.ssllabs.com/ssltest/analyze.html?d=facebook.com&s=173.252.110.27
*/


var intermediates = [
  {
    name: "SHA-2 with SHA-1 IM, twitter.com",
    domain: "twitter.com",
    // diagnosis: "almost",
    cert: {good: true, algorithm: "sha256"},
    intermediates: [{good: false, algorithm: "sha1"}]
  },
  {
    name: "SHA-1 with SHA-1 IM, facebook.com",
    domain: "facebook.com",
    // diagnosis: "bad",
    cert: {good: false, algorithm: "sha1"},
    intermediates: [
      {good: false, algorithm: "sha1"},
      {good: false, algorithm: "sha1"}
    ]
  }
];

intermediates.forEach(function(site) {
  test(site.name, function(t) {
    shaaaaa.from(site.domain, function(err, answer) {
      if (err) t.fail("Error checking domain: " + err);

      t.equal(site.domain, answer.domain, "Domain mismatch.");

      t.equal(site.cert.algorithm, answer.cert.algorithm, "Wrong client algorithm.");
      t.equal(site.cert.good, answer.cert.good, "Wrong client diagnosis.");

      for (var i=0; i<answer.intermediates.length; i++) {
        t.equal(site.intermediates[i].good, answer.intermediates[i].good, "Intermediate " + i + ": wrong diagnosis.")
        t.equal(site.intermediates[i].algorithm, answer.intermediates[i].algorithm, "Intermediate " + i + ": wrong algorithm.")
      }

      t.end();
    });
  });
});