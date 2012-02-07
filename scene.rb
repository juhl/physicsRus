#!/usr/bin/ruby
# -*- coding: utf-8 -*-
require 'cgi'
require 'iconv'

cgi = CGI.new()

#conv = Iconv.new('UTF-8', 'euc-kr')
#conv.iconv(f.read);

print "Content-type: text/plain, encoding=UTF-8\r\n\r\n"

begin
  if cgi['action'] == 'list'
    Dir.chdir("scenes");
    files = Dir.glob("*.json")
    files.each {|x| print x, "\n" }  
  elsif action == 'save'    
    filename = cgi['filename']
    File.open("#{filename}", "w") do |f|
      f << cgi['file'];
    end
  end
rescue
  print $!
end
