using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net.Sockets;
using System.Net;
using System.IO;
using System.Web;
using System.Collections.Specialized;
using System.Text.RegularExpressions;
using System.Threading;
using System.Security.Cryptography;

namespace WebSocks
{
    public class WebSockServer
    {

        /// <summary>
        /// Port number to listen on
        /// </summary>
        private const int PortNumber = 8181;

        /// <summary>
        /// Socket which awaits connections
        /// </summary>
        private static Socket ListenerSocket;

        /// <summary>
        /// Thread in which we await for incomming connections.
        /// </summary>
        static System.Threading.Thread _serverThread;


        static WebSockServer() { }

        /// <summary>
        /// Starts thread with listening socket.
        /// </summary>
        public static void Start()
        {
            System.Threading.ThreadStart ts = new System.Threading.ThreadStart(Listen);
            _serverThread = new System.Threading.Thread(ts);
            _serverThread.Start();
        }

        /// <summary>
        /// Stops listening for connections.
        /// </summary>
        public static void End()
        {
            _serverThread.Abort();
            ListenerSocket.Close();
        }

        public static void Listen()
        {
            //Start listening
            ListenerSocket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            EndPoint ep = new IPEndPoint(IPAddress.Parse("0.0.0.0"), PortNumber);
            ListenerSocket.Bind(ep);
            ListenerSocket.Listen(5);

            while (true)
            {
                //New client
                using (Socket client = ListenerSocket.Accept())
                {
                    //Receiving clientHandshake
                    string clientHandshake = String.Empty;
                    byte[] buffer = null;
                    int readBytes = 0;
                    do
                    {
                        buffer = new byte[client.Available];
                        readBytes = client.Receive(buffer);
                        clientHandshake += Encoding.UTF8.GetString(buffer);
                    }
                    while (client.Available > 0);

                    //Last eight bytes are body of requets (we should include it in response)
                    byte[] secKey3 = buffer.Skip(readBytes - 8).Take(8).ToArray();

                    //Variables we can extract from clientHandshake
                    string clientOrigin = String.Empty;
                    string secKey1 = String.Empty;
                    string secKey2 = String.Empty;

                    //Extracting values from headers (key:value)
                    string[] clientHandshakeLines = Regex.Split(clientHandshake, Environment.NewLine);
                    foreach (string hline in clientHandshakeLines)
                    {
                        int valueStartIndex = hline.IndexOf(':') + 2;
                        if (valueStartIndex > 0)
                        {
                            if (hline.StartsWith("Origin"))
                            {
                                clientOrigin = hline.Substring(valueStartIndex, hline.Length - valueStartIndex);
                            }
                            else if (hline.StartsWith("Sec-WebSocket-Key2"))
                            {
                                secKey2 = hline.Substring(valueStartIndex, hline.Length - valueStartIndex);
                            }
                            else if (hline.StartsWith("Sec-WebSocket-Key1"))
                            {
                                secKey1 = hline.Substring(valueStartIndex, hline.Length - valueStartIndex);
                            }
                        }
                    }

                    //This part is common for all websockets editions (v. 75 & v.76)
                    client.Send(Encoding.UTF8.GetBytes("HTTP/1.1 101 Web Socket Protocol Handshake" + Environment.NewLine));
                    client.Send(Encoding.UTF8.GetBytes("Upgrade: WebSocket" + Environment.NewLine));
                    client.Send(Encoding.UTF8.GetBytes("Connection: Upgrade" + Environment.NewLine));

                    //Checking if we have 76 client
                    if (String.IsNullOrEmpty(secKey1) && String.IsNullOrEmpty(secKey2))
                    {
                        //No keys <= 75                      
                        client.Send(Encoding.UTF8.GetBytes(String.Format("WebSocket-Origin: {0}", clientOrigin) + Environment.NewLine));
                        client.Send(Encoding.UTF8.GetBytes("WebSocket-Location: ws://localhost:8181/websock" + Environment.NewLine));
                        client.Send(Encoding.UTF8.GetBytes(Environment.NewLine));
                    }
                    else
                    {
                        //Keys present, this means 76 version is used. Writing Sec-* headers 
                        client.Send(Encoding.UTF8.GetBytes(String.Format("Sec-WebSocket-Origin: {0}", clientOrigin) + Environment.NewLine));
                        client.Send(Encoding.UTF8.GetBytes("Sec-WebSocket-Location: ws://localhost:8181/websock" + Environment.NewLine));
                        client.Send(Encoding.UTF8.GetBytes(Environment.NewLine));

                        //Calculating response body
                        byte[] secret = CalculateSecurityBody(secKey1, secKey2, secKey3);
                        client.Send(secret);
                    }

                    Thread.Sleep(100);

                    client.Send(new byte[] { 0x00 });
                    client.Send(Encoding.UTF8.GetBytes("Hello world!"));
                    client.Send(new byte[] { 0xFF });
                    var text = "";
                    do
                    {
                        while (client.Available == 0)
                        {

                        }
                        var buf = new byte[client.Available];
                        var received = client.Receive(buf);
                        client.Send(new byte[] { 0x00 });
                        client.Send(buf);
                        client.Send(new byte[] { 0xFF });
                        text = buf.Length + "";
                    } while (text != "3");
                }
            }
        }


        public static byte[] CalculateSecurityBody(string secKey1, string secKey2, byte[] secKey3)
        {
            //Remove all symbols that are not numbers
            string k1 = Regex.Replace(secKey1, "[^0-9]", String.Empty);
            string k2 = Regex.Replace(secKey2, "[^0-9]", String.Empty);

            //Convert received string to 64 bit integer.
            Int64 intK1 = Int64.Parse(k1);
            Int64 intK2 = Int64.Parse(k2);

            //Dividing on number of spaces
            int k1Spaces = secKey1.Count(c => c == ' ');
            int k2Spaces = secKey2.Count(c => c == ' ');
            int k1FinalNum = (int)(intK1 / k1Spaces);
            int k2FinalNum = (int)(intK2 / k2Spaces);

            //Getting byte parts
            byte[] b1 = BitConverter.GetBytes(k1FinalNum).Reverse().ToArray();
            byte[] b2 = BitConverter.GetBytes(k2FinalNum).Reverse().ToArray();
            //byte[] b3 = Encoding.UTF8.GetBytes(secKey3);
            byte[] b3 = secKey3;

            //Concatenating everything into 1 byte array for hashing.
            List<byte> bChallenge = new List<byte>();
            bChallenge.AddRange(b1);
            bChallenge.AddRange(b2);
            bChallenge.AddRange(b3);

            //Hash and return
            byte[] hash = MD5.Create().ComputeHash(bChallenge.ToArray());
            return hash;
        }
    }
}
