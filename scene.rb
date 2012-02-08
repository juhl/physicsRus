#!/usr/bin/ruby                                                                                     
# -*- coding: utf-8 -*-                                                                             
require 'cgi'
require 'iconv'

cgi = CGI.new()

#conv = Iconv.new('UTF-8', 'euc-kr')                                                                
#conv.iconv(f.read);                                                                                

print "Content-type: text/plain, encoding=UTF-8\r\n\r\n"

action = cgi['action']

begin
  if action == 'list'
    Dir.chdir('scenes')
    files = Dir.glob('*.json')
    files.each {|x| puts x }
  elsif action == 'save'
    filename = cgi['filename']
    File.open("scenes/#{filename}", 'w') do |f|
      f << cgi['text']
    end
  end
rescue
  print $!
end