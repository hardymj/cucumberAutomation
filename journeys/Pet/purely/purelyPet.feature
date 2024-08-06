@PurelyPet
Feature: PurelyPet

Background:Before Test Scenarios
  Given I use a browser

@SimpleTest
  Scenario:1 PurelyPet
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button href "https://staging-purelypets.ultimateins.co.uk/"
    And I check I'm on the right page "BuyOnlineURL"
  
@Hamburger
  Scenario:2 Click on Dog Insurance in Pet Insurance dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "hamburger" if found
    And I click on this button class "dropdown-toggle" option "1"
    And I click on this button href "/dog-insurance/"
    And I check I'm on the right page "DogInsuranceURL"

  Scenario:3 Click on Cat insurance in Pet insurance dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "1"
    And I click on this button href "/cat-insurance/"
    And I check I'm on the right page "CatInsuranceURL"

  Scenario:4 Click on Puppy insurance in Pet insurance dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "1"
    And I click on this button href "https://www.purelypetsinsurance.co.uk/puppy-insurance/"
    And I check I'm on the right page "PuppyInsuranceURL"
    
  Scenario:5 Click on Pet insurance in Pet insurance dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "1"
    And I click on this button href "https://www.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "PetInsuranceURL"

  Scenario:6 Click on Get a quote online on top of page
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button href "https://quote.purelypetsinsurance.co.uk/"
    And I switch browser tab to "1"
    And I check I'm on the right page "BuyOnlineProdURL"
    
  Scenario:7 Click on Make or Track a claim
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button href "/make-track-a-claim/" 
    And I check I'm on the right page "TrackAClaimURL"

  Scenario:8 Click on the Manage my policy
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "2"
    And I click on this button href "/existing-customers/manage-my-policy/"
    And I check I'm on the right page "ManageYourPolicyURL"

  Scenario:9 Click on Contact Us 
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "2"
    And I click on this button href "/existing-customers/contact-us"
    And I check I'm on the right page "ContactUsURL"
    And I enter "Test" on the textbox id "1f238cb2-70d9-4dec-c6ec-b049c76d9fd1"
    And I enter "Pol124" on the textbox id "8a7d39a8-a472-40d3-fee4-d5d05b4d7a09"
    And I enter "sandiesalmon@markerstudy.com" on the textbox id "c50ea394-b48e-40e9-f8fe-acbb728b2fc7"
    And I enter "07984155555" on the textbox id "2c96d4a2-6edc-4066-eded-ba1192273765"
    And I enter "Claims" on the dropdown id "08d085d2-0fc4-490c-f012-262200b2ad2d"
    And I enter "This is a test" on the textbox id "8ac02047-9829-436d-a0fc-5f31892337b5"
    And I switch to recaptcha
    And I click on this button id "recaptcha-anchor"
    And I switch to a the default frame
    And I click on this button class "btn primary"
    And I wait for field class "umbraco-forms-submitmessage" to contain "Thank you for contacting us"

  Scenario:10 Click on Speak to a vet
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "2"
    And I click on this button href "/speak-to-a-vet/"
    And I check I'm on the right page "SpeakToVetURL"

  Scenario:11 Click on Complaint in dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "2"
    And I click on this button href "/existing-customers/complaints/"
    And I check I'm on the right page "ComplaintURL"
     
  Scenario:12 Click on Other Insurances in dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "2"
    And I click on this button href "/existing-customers/other-insurance-services/"
    And I check I'm on the right page "OtherInsurancetURL"

  Scenario:13 Click on News in dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "3"
    And I click on this button href "/blogs/"
    And I check I'm on the right page "BlogURL"

  Scenario:14 Click on FAQs in dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "3"
    And I click on this button href "/faqs/"
    And I check I'm on the right page "FAQsURL"

  Scenario:15 Click on Dog health behaviour in dropdown
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "3"
    And I click on this button href "/dog-health-behaviour"
    And I check I'm on the right page "DogHealthURL"

  Scenario:16 Click on pink Get your quote button in top nav
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button href "https://quote.purelypetsinsurance.co.uk/"
    And I switch browser tab to "1"
    And I check I'm on the right page "BuyOnlineProdURL"

Scenario:17 Click on Login button in top nav
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "btn btn-block btn-login"
    And I check I'm on the right page "ManagePolicyURL"
  
Scenario:18 Click on the phone icon in top nav
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "call-button"
    And I wait for field class "modal-body text-center" to contain "Our opening times are:"

Scenario:19 Click on the Explore link on dog cover level and validate Lifetime Bronze
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "link-text"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Lifetime Bronze"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Lifetime cover"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Vets fees from £1,000-£5,000"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Flexible Excess Options"
    And I click on this button xpath "//*[@id='parent-dog-bronze']/button/span[1]"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[1]" to contain "Complementary treatment £500"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[2]" to contain "Third party liability (dogs only) £1M"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[3]" to contain "Death from illness £1,000*"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[4]" to contain "Death from accident £1,000"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[5]" to contain "Boarding Fees £1,000"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[6]" to contain "Holiday cancellation £1,000"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[7]" to contain "Loss by theft/straying £1,000"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/ul/li[8]" to contain "Advertising and reward £1,000"
    And I wait for field xpath "//*[@id='parent-dog-bronze']/div[3]/p/span" to contain "*Death from illness does not apply to dogs aged 9 and over & cats aged 11 and over"
    And I click on this button class "button" 
    And I switch browser tab to "1"
    And I check I'm on the right page "BuyOnlineURL"

    Scenario:20 Click on the Explore link on dog cover level and validate Lifetime Silver
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "link-text"
    And I wait for field class "col-xs-4 silver cover-type" to contain "Lifetime Silver"
    And I wait for field class "col-xs-4 silver cover-type" to contain "Lifetime cover"
    And I wait for field class "col-xs-4 silver cover-type" to contain "Vets fees from £6,000-£10,000"
    And I wait for field class "col-xs-4 silver cover-type" to contain "Flexible Excess Options"
    And I click on this button xpath "//*[@id='parent-dog-silver']/button/span[2]"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[1]" to contain "Complementary treatment £750"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[2]" to contain "Third party liability (dogs only) £2M"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[3]" to contain "Death from illness £1,500*"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[4]" to contain "Death from accident £1,500"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[5]" to contain "Boarding Fees £1,500"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[6]" to contain "Holiday cancellation £1,500"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[7]" to contain "Loss by theft/straying £1,500"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/ul/li[8]" to contain "Advertising and reward £1,500"
    And I wait for field xpath "//*[@id='parent-dog-silver']/div[3]/p/span" to contain "*Death from illness does not apply to dogs aged 9 and over & cats aged 11 and over"
    And I click on this button class "button" 
    And I switch browser tab to "1"
    And I check I'm on the right page "BuyOnlineURL"

  Scenario:21 Click on the Explore link on dog cover level and validate Lifetime Gold
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "link-text"
    And I wait for field class "col-xs-4 gold cover-type" to contain "Lifetime Gold"
    And I wait for field class "col-xs-4 gold cover-type" to contain "Lifetime cover"
    And I wait for field class "col-xs-4 gold cover-type" to contain "Vets fees from £11,000-£15,000"
    And I wait for field class "col-xs-4 gold cover-type" to contain "Flexible Excess Options"
    And I click on this button xpath "//*[@id='parent-dog-gold']/button/span[1]"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[1]" to contain "Complementary treatment £1,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[2]" to contain "Third party liability (dogs only) £2M"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[3]" to contain "Death from illness £2,000*"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[4]" to contain "Death from accident £2,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[5]" to contain "Boarding Fees £2,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[6]" to contain "Holiday cancellation £2,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[7]" to contain "Loss by theft/straying £2,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/ul/li[8]" to contain "Advertising and reward £2,000"
    And I wait for field xpath "//*[@id='parent-dog-gold']/div[3]/p/span" to contain "*Death from illness does not apply to dogs aged 9 and over & cats aged 11 and over"
    And I click on this button class "button" 
    And I switch browser tab to "1"
    And I check I'm on the right page "BuyOnlineURL"

    Scenario:22 Click on the Explore link on cat cover level and validate Lifetime Bronze
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "link-text"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Lifetime Bronze"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Lifetime cover"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Vets fees from £1,000-£5,000"
    And I wait for field class "col-xs-4 bronze cover-type" to contain "Flexible Excess Options"
    
    Scenario:23 Validate FAQs section 
    When I go to this url "https://azuat.purelypetsinsurance.co.uk/"
    And I check I'm on the right page "purelyPetUrl"
    And I accept cookies
    And I click on this button class "dropdown-toggle" option "1"
    And I wait for field class "panel" to contain "As well as finding the best cover for your beloved pet, you’ll also want to find the best deal on cat insurance or dog insurance. And that means doing your research."





 


  

    